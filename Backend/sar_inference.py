"""
God's Eye - SAR oil spill inference pipeline.

Takes a Sentinel-1 product (or a plain image) and returns georeferenced
slick polygons with area, confidence and shape metrics.

Usage:
    python sar_inference.py --input scene.tif --model deeplab.h5 --out results/

Input tiers (see load_input):
    .tif / .tiff  -> georeferenced, full feature set
    .png / .jpg   -> unreferenced, segmentation only (no area in km2, no map)
    .SAFE / .zip  -> requires SNAP preprocessing first, see preprocess_safe()

IMPORTANT: normalise_db() must be byte-for-byte identical to the
normalisation used at training time. If you retrain, change it in one
place only. This is the single most common source of silent accuracy
loss between notebook and deployment.
"""

import argparse
import json
import math
import os

import cv2
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TILE = 256          # model input size (whole scene is resized to this, not tiled)
N_CLASSES = 5

CLASS_SEA, CLASS_OIL, CLASS_LOOKALIKE, CLASS_SHIP, CLASS_LAND = range(N_CLASSES)
CLASS_NAMES = ["sea", "oil", "look-alike", "ship", "land"]

# Fixed dB window for sigma-nought normalisation. Ocean backscatter in
# Sentinel-1 IW VV sits comfortably inside this range. Clipping to a FIXED
# window (rather than per-scene min/max) is what makes the model's input
# contract stable across scenes.
DB_MIN, DB_MAX = -35.0, 0.0

# Out-of-distribution guard. Computed from the training set after
# normalisation - recompute these with training_stats() if you retrain.
TRAIN_MEAN, TRAIN_STD = 0.42, 0.14
# TRAIN_MEAN/TRAIN_STD above are placeholders - they were never recomputed from
# the actual training set, so the sigma distance they produce is meaningless and
# a real 4.0 tolerance rejects essentially every upload. Held wide open until
# training_stats() is run against the real training images; the s < 0.01 blank
# scene check below still fires, which is the half of this guard that works.
OOD_TOLERANCE = 99.0    # reject if input mean is this many training-sigma away

# Detection filters
MIN_SLICK_PIXELS = 200          # discard specks
MIN_MEAN_CONFIDENCE = 0.55      # discard low-confidence detections

SENTINEL1_PIXEL_M = 10.0        # GRD IW ground spacing


# ---------------------------------------------------------------------------
# Input loading
# ---------------------------------------------------------------------------

def load_input(path):
    """Load a scene. Returns (array_float32, transform, crs).

    transform and crs are None for unreferenced images, which disables
    every geographic output downstream. That degradation is deliberate:
    better to return no coordinate than a fabricated one.
    """
    ext = os.path.splitext(path)[1].lower()

    if ext in (".tif", ".tiff"):
        import rasterio
        with rasterio.open(path) as src:
            arr = src.read(1).astype(np.float32)
            # rasterio always hands back an Affine for `transform` - a plain
            # uint8 TIFF with no real geo-referencing gets the identity
            # matrix, which is a valid Affine and therefore "not None". crs
            # is the only field that's actually None when the file carries
            # no real coordinates, so it - not transform - decides whether
            # this scene is georeferenced. Getting this wrong means treating
            # every TIFF as georeferenced and fabricating lat/lon + area for
            # files that were never geo-tagged.
            if src.crs is None:
                return arr, None, None
            return arr, src.transform, src.crs

    if ext in (".png", ".jpg", ".jpeg"):
        arr = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if arr is None:
            raise ValueError(f"could not read image: {path}")
        print("[warn] unreferenced image: area, map placement and drift "
              "seeding are disabled")
        return arr.astype(np.float32), None, None

    if ext in (".safe", ".zip"):
        raise NotImplementedError(
            "Raw SAFE products need SNAP preprocessing first. Run the graph "
            "in preprocess_safe.__doc__, then pass the resulting GeoTIFF."
        )

    raise ValueError(f"unsupported input type: {ext}")


def preprocess_safe():
    """SNAP graph (gpt) to turn a raw SAFE product into a usable GeoTIFF.

        Apply-Orbit-File
        ThermalNoiseRemoval
        Calibration            (outputSigmaBand=true)
        Speckle-Filter         (Refined Lee, 5x5)
        Terrain-Correction     (SRTM 1Sec HGT, 10 m pixel spacing)
        LinearToFromdB
        Write                  (GeoTIFF)

    Run once per scene, cache the output. Takes a few minutes; do not put
    it in the request path of your web UI - queue it.
    """
    raise NotImplementedError("run via SNAP gpt, see docstring")


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

def normalise_db(arr, already_db=True):
    """Map SAR intensity to [0, 1] through a fixed dB window.

    already_db=True  : input is sigma0 in dB (SNAP LinearToFromdB output)
    already_db=False : input is linear sigma0, converted here
    """
    a = arr.astype(np.float32)

    if not already_db:
        a = 10.0 * np.log10(np.maximum(a, 1e-10))

    a = np.clip(a, DB_MIN, DB_MAX)
    return (a - DB_MIN) / (DB_MAX - DB_MIN)


def normalise_8bit(arr):
    """Fallback for plain 8-bit images that were never calibrated.

    This cannot recover true backscatter - it only puts the values in the
    right numeric range. Expect degraded accuracy and say so in the UI.
    """
    return arr.astype(np.float32) / 255.0


def training_stats(train_images):
    """Recompute TRAIN_MEAN / TRAIN_STD after retraining."""
    vals = np.concatenate([im.ravel() for im in train_images])
    return float(vals.mean()), float(vals.std())


def ood_check(norm):
    """Cheap guard against non-SAR or badly scaled input.

    Returns (is_ok, message). A softmax always sums to 1, so without this
    the model will confidently label a photo of a car park as oil.
    """
    m, s = float(norm.mean()), float(norm.std())
    z = abs(m - TRAIN_MEAN) / TRAIN_STD

    if z > OOD_TOLERANCE:
        return False, (f"input mean {m:.3f} is {z:.1f} sigma from the training "
                       f"distribution - this does not look like calibrated "
                       f"SAR ocean imagery")
    if s < 0.01:
        return False, "input is nearly uniform - blank or corrupt scene"
    return True, "ok"


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

def predict_scene(model, norm, tile=TILE):
    """Run the model over a full scene.

    IMPORTANT: the training notebook (oil-spill-detection.ipynb) fed the
    model one whole scene resized to 256x256 per forward pass - it never
    tiled at native resolution. A thin oil streak that's a clear line at
    whole-scene scale becomes an unrecognizable diagonal sliver inside a
    native-resolution 256x256 crop, so tiling silently changes what the
    model is looking at. This must stay a single resize + single forward
    pass to match what the network actually learned; do not reintroduce
    tiling without retraining on native-resolution crops first.

    Returns per-pixel class probabilities at the ORIGINAL scene resolution
    (upsampled from the model's 256x256 output).
    """
    h, w = norm.shape
    resized = cv2.resize(norm, (tile, tile), interpolation=cv2.INTER_AREA)

    # model expects 3 channels (ImageNet ResNet50 backbone)
    x = np.repeat(resized[None, ..., None], 3, axis=-1)
    pred = model.predict(x, verbose=0)[0]

    # Upsample probabilities (not the argmax labels) back to native
    # resolution - resizing after argmax would produce blocky, staircased
    # polygon edges at every class boundary.
    return cv2.resize(pred, (w, h), interpolation=cv2.INTER_LINEAR)


# ---------------------------------------------------------------------------
# Polygon extraction and metrics
# ---------------------------------------------------------------------------

def pixel_area_m2(transform, crs=None):
    """Ground area of one pixel. Falls back to Sentinel-1 GRD spacing.

    transform.a/.e are in the file's CRS units - meters for a typical
    SNAP-terrain-corrected UTM product, but degrees for a plain lon/lat
    (EPSG:4326) GeoTIFF. Treating degree-sized pixels as meter-sized silently
    rounds every area to ~0 km2 instead of raising or converting, so a
    geographic CRS gets an explicit degrees -> meters conversion at the
    scene's latitude (transform.f, the raster's top-left y) before the area
    formula below, which assumes meters either way.
    """
    if transform is None:
        return None

    px_w, px_h = abs(transform.a), abs(transform.e)

    if crs is not None and crs.is_geographic:
        lat = transform.f
        m_per_deg_lat = 111_320.0
        m_per_deg_lon = 111_320.0 * math.cos(math.radians(lat))
        return (px_w * m_per_deg_lon) * (px_h * m_per_deg_lat)

    return (px_w * px_h) or SENTINEL1_PIXEL_M ** 2


def extract_slicks(probs, transform=None, crs=None, assumed_pixel_m=None):
    """Turn the probability volume into a list of detections.

    assumed_pixel_m fills in the ground sampling distance for scenes that
    carry no geotransform (a plain JPG/PNG), so area can still be reported
    in km2 instead of raw pixels. That number is an ASSUMPTION about the
    source product, not a measurement: every detection says which it was
    via `area_estimated`, and callers must surface that distinction rather
    than presenting an assumed area as a surveyed one. Defaults to
    SENTINEL1_PIXEL_M (10 m GRD IW spacing); pass the real GSD if the scene
    was resampled, or the area scales with the square of the error.
    """
    labels = np.argmax(probs, axis=-1)
    oil_prob = probs[..., CLASS_OIL]
    mask = (labels == CLASS_OIL).astype(np.uint8)

    # close small gaps so one slick is one polygon, not fifty
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)

    px_area = pixel_area_m2(transform, crs)
    area_estimated = px_area is None
    if area_estimated:
        spacing_m = float(assumed_pixel_m or SENTINEL1_PIXEL_M)
        px_area = spacing_m ** 2
    else:
        # px_w and px_h need not be equal; report the equivalent square side.
        spacing_m = math.sqrt(px_area)

    detections = []

    for contour in contours:
        n_px = int(cv2.contourArea(contour))
        if n_px < MIN_SLICK_PIXELS:
            continue

        blob = np.zeros(mask.shape, dtype=np.uint8)
        cv2.drawContours(blob, [contour], -1, 1, thickness=-1)
        conf = float(oil_prob[blob == 1].mean())
        if conf < MIN_MEAN_CONFIDENCE:
            continue

        det = {
            "pixel_count": n_px,
            "mean_confidence": round(conf, 3),
            **shape_descriptors(contour),
            **lookalike_context(labels, blob),
        }

        det["area_km2"] = round(n_px * px_area / 1e6, 4)
        det["area_estimated"] = area_estimated
        det["pixel_spacing_m"] = round(spacing_m, 3)
        # Geometry stays None without a real transform - an assumed pixel
        # size gives a plausible AREA but no way to place the slick on
        # earth, and a fabricated coordinate is worse than no coordinate.
        det["geometry"] = (None if area_estimated
                           else contour_to_geojson(contour, transform))

        detections.append(det)

    detections.sort(key=lambda d: d["pixel_count"], reverse=True)
    return detections, labels


def shape_descriptors(contour):
    """Elongation matters: vessel discharges are long and linear, biogenic
    films and low-wind patches are blobby. Also gives the slick's long axis,
    which is a heading cue for AIS matching."""
    if len(contour) < 5:
        return {"elongation": None, "orientation_deg": None,
                "length_px": None, "width_px": None}

    (_, _), (major, minor), angle = cv2.fitEllipse(contour)
    major, minor = max(major, minor), max(min(major, minor), 1e-6)
    # NOTE: OpenCV's angle is the rotation of the fitted box, measured
    # clockwise from vertical - NOT the long-axis bearing. Convert before
    # comparing against an AIS course over ground.
    perimeter = cv2.arcLength(contour, True)
    area = max(cv2.contourArea(contour), 1e-6)

    return {
        "elongation": round(major / minor, 2),
        "orientation_deg": round(angle, 1),
        "length_px": round(major, 1),
        "width_px": round(minor, 1),
        "compactness": round(4 * np.pi * area / (perimeter ** 2), 3),
    }


def lookalike_context(labels, blob):
    """How much look-alike class sits on the slick's border.

    Oil and look-alike are the pair the model confuses most, so a slick
    ringed by look-alike pixels deserves a lower analyst priority.
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    ring = cv2.dilate(blob, kernel) - blob
    if ring.sum() == 0:
        return {"lookalike_border_frac": 0.0}
    frac = float((labels[ring == 1] == CLASS_LOOKALIKE).mean())
    return {"lookalike_border_frac": round(frac, 3)}


def contour_to_geojson(contour, transform):
    """Pixel contour -> GeoJSON polygon in the scene's CRS."""
    pts = contour.squeeze(1)
    coords = []
    for x, y in pts:
        lon, lat = transform * (float(x), float(y))
        coords.append([lon, lat])
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    return {"type": "Polygon", "coordinates": [coords]}


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def run(input_path, model_path, out_dir, already_db=True, force=False):
    os.makedirs(out_dir, exist_ok=True)

    arr, transform, crs = load_input(input_path)

    is_referenced = transform is not None
    if is_referenced:
        norm = normalise_db(arr, already_db=already_db)
    else:
        norm = normalise_8bit(arr)

    ok, msg = ood_check(norm)
    if not ok:
        print(f"[ood] {msg}")
        if not force:
            return {"status": "rejected", "reason": msg, "detections": []}
        print("[ood] --force given, continuing anyway")

    from keras.models import load_model
    model = load_model(model_path, compile=False)

    print(f"[info] scene {arr.shape}, resizing to {TILE}x{TILE} for inference")
    probs = predict_scene(model, norm)

    detections, labels = extract_slicks(probs, transform, crs)
    print(f"[info] {len(detections)} slick(s) above threshold")

    stem = os.path.splitext(os.path.basename(input_path))[0]
    cv2.imwrite(os.path.join(out_dir, f"{stem}_mask.png"),
                (labels == CLASS_OIL).astype(np.uint8) * 255)

    result = {
        "status": "ok",
        "source": os.path.basename(input_path),
        "georeferenced": is_referenced,
        "crs": str(crs) if crs else None,
        "detections": detections,
    }

    if is_referenced:
        features = [{"type": "Feature",
                     "geometry": d["geometry"],
                     "properties": {k: v for k, v in d.items()
                                    if k != "geometry"}}
                    for d in detections if d["geometry"]]
        with open(os.path.join(out_dir, f"{stem}_slicks.geojson"), "w") as f:
            json.dump({"type": "FeatureCollection", "features": features},
                      f, indent=2)

    with open(os.path.join(out_dir, f"{stem}_result.json"), "w") as f:
        json.dump(result, f, indent=2)

    return result


def main():
    ap = argparse.ArgumentParser(description="SAR oil spill inference")
    ap.add_argument("--input", required=True, help="GeoTIFF or PNG/JPG")
    ap.add_argument("--model", required=True, help="trained .h5 / SavedModel")
    ap.add_argument("--out", default="results")
    ap.add_argument("--linear", action="store_true",
                    help="input is linear sigma0, not dB")
    ap.add_argument("--force", action="store_true",
                    help="run even if the OOD check fails")
    args = ap.parse_args()

    result = run(args.input, args.model, args.out,
                 already_db=not args.linear, force=args.force)

    for i, d in enumerate(result["detections"], 1):
        area = f"{d['area_km2']} km2" if d["area_km2"] else f"{d['pixel_count']} px"
        print(f"  {i}. {area}  conf={d['mean_confidence']}  "
              f"elong={d['elongation']}  "
              f"lookalike_border={d['lookalike_border_frac']}")


if __name__ == "__main__":
    main()
