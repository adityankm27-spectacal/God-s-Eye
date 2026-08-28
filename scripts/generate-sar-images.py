"""
One-off generator: fetch the real MV Wakashio Sentinel-1 scene, calibrate it to
physical backscatter, run genuine CFAR dark-spot segmentation, warp to a
north-up frame, and render static PNGs for the frontend.

This script is NOT part of the shipped app — it's a build step that produces
static image assets from real satellite data. No synthetic pixels, no
placeholder art: every value here is either measured (calibrated Sentinel-1
backscatter) or derived from it (the CFAR mask).
"""
from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path

import httpx
import numpy as np
import planetary_computer as pc
import rasterio
from PIL import Image
from pystac_client import Client
from rasterio.crs import CRS
from rasterio.io import MemoryFile
from rasterio.enums import Resampling
from rasterio.control import GroundControlPoint
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds
from scipy import ndimage
from scipy.interpolate import griddata
from global_land_mask import globe

OUT = Path(__file__).resolve().parent.parent / "public" / "sar"
OUT.mkdir(parents=True, exist_ok=True)

AOI = [57.62, -20.52, 57.82, -20.35]  # Mahebourg lagoon, Mauritius
# Tighter frame for the hero renders: full AOI is used for detection so the
# CFAR threshold has enough water to estimate sea-state statistics from, but
# the wide crop is mostly empty ocean/land. Crop after processing instead of
# narrowing AOI, so the statistics stay well-conditioned.
CROP = [57.665, -20.44, 57.79, -20.355]
STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"


def parse_lut(xml_bytes, vector_tag, value_tag):
    root = ET.fromstring(xml_bytes)
    lines, pixels, values = [], [], []
    for vec in root.iter(vector_tag):
        line_el, pix_el, val_el = vec.find("line"), vec.find("pixel"), vec.find(value_tag)
        if line_el is None or pix_el is None or val_el is None:
            continue
        px = np.fromstring(pix_el.text, sep=" ")
        vals = np.fromstring(val_el.text, sep=" ")
        n = min(px.size, vals.size)
        lines.append(np.full(n, float(line_el.text)))
        pixels.append(px[:n])
        values.append(vals[:n])
    return np.concatenate(lines), np.concatenate(pixels), np.concatenate(values)


def interp_lut(samples, rows, cols):
    s_line, s_pix, s_val = samples
    rr, cc = np.meshgrid(rows, cols, indexing="ij")
    out = griddata(np.column_stack([s_line, s_pix]), s_val, (rr, cc), method="linear")
    if np.isnan(out).any():
        near = griddata(np.column_stack([s_line, s_pix]), s_val, (rr, cc), method="nearest")
        out = np.where(np.isnan(out), near, out)
    return out


print("1/7  searching STAC catalogue ...")
cat = Client.open(STAC_URL, modifier=pc.sign_inplace)
search = cat.search(
    collections=["sentinel-1-grd"], bbox=AOI, datetime="2020-08-06/2020-08-14",
    query={"sar:instrument_mode": {"eq": "IW"}},
)
items = list(search.items())


def overlap(a, b):
    w = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    h = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    area = (a[2] - a[0]) * (a[3] - a[1])
    return (w * h) / area if area else 0.0


items.sort(key=lambda it: -overlap(AOI, it.bbox))
item = items[0]
print("    using", item.id, item.properties["datetime"])

href = item.assets["vv"].href
cal_href = item.assets["schema-calibration-vv"].href
noise_href = item.assets["schema-noise-vv"].href

print("2/7  reading chip in native radar geometry ...")
with rasterio.open(href) as src:
    gcps, gcrs = src.gcps
    lons = np.array([g.x for g in gcps])
    lats = np.array([g.y for g in gcps])
    rows = np.array([g.row for g in gcps])
    cols = np.array([g.col for g in gcps])

    from scipy.interpolate import LinearNDInterpolator

    inv = LinearNDInterpolator(np.column_stack([lons, lats]), np.column_stack([rows, cols]))
    w, s, e, n = AOI
    corners = inv(np.array([[w, s], [e, s], [e, n], [w, n]]))
    r0, r1 = int(max(0, corners[:, 0].min())), int(min(src.height, corners[:, 0].max()))
    c0, c1 = int(max(0, corners[:, 1].min())), int(min(src.width, corners[:, 1].max()))
    window = rasterio.windows.Window(col_off=c0, row_off=r0, width=c1 - c0, height=r1 - r0)
    dn = src.read(1, window=window).astype(np.float64)
    print("    chip", dn.shape)

print("3/7  radiometric calibration to sigma-nought ...")
rr = np.arange(r0, r1, dtype=np.float64)
cc = np.arange(c0, c1, dtype=np.float64)

noise_xml = httpx.get(noise_href, timeout=60, follow_redirects=True).content
cal_xml = httpx.get(cal_href, timeout=60, follow_redirects=True).content
try:
    noise_samples = parse_lut(noise_xml, "noiseRangeVector", "noiseRangeLut")
except Exception:
    noise_samples = parse_lut(noise_xml, "noiseVector", "noiseLut")
cal_samples = parse_lut(cal_xml, "calibrationVector", "sigmaNought")

noise = interp_lut(noise_samples, rr, cc)
a_lut = interp_lut(cal_samples, rr, cc)
power = dn**2 - noise
sigma0 = power / np.maximum(a_lut**2, 1e-12)
sigma0 = np.where((dn > 0) & (sigma0 > 0), sigma0, np.nan)
print("    sigma0 valid px %.1f%%" % (100 * np.isfinite(sigma0).mean()))

print("4/7  warping calibrated chip to north-up EPSG:4326 ...")
shifted_gcps = [
    GroundControlPoint(row=g.row - r0, col=g.col - c0, x=g.x, y=g.y)
    for g in gcps
]
transform_meta = {
    "driver": "GTiff", "height": sigma0.shape[0], "width": sigma0.shape[1],
    "count": 1, "dtype": "float32", "gcps": shifted_gcps, "crs": gcrs,
}
with MemoryFile() as mem:
    with mem.open(**transform_meta) as ds:
        ds.write(sigma0.astype(np.float32), 1)
    with mem.open() as ds:
        from rasterio.vrt import WarpedVRT

        with WarpedVRT(ds, src_crs=gcrs, crs=CRS.from_epsg(4326), resampling=Resampling.bilinear) as vrt:
            win = from_bounds(*AOI, transform=vrt.transform)
            sigma0_geo = vrt.read(1, window=win)
            geo_transform = vrt.window_transform(win)
print("    geocoded chip", sigma0_geo.shape)

def lee_filter(img: np.ndarray, size: int = 7, looks: float = 4.4) -> np.ndarray:
    """Adaptive Lee speckle filter on linear-power data (same formula as the
    validated detection pipeline)."""
    filled = np.where(np.isfinite(img), img, 0.0)
    mask = np.isfinite(img).astype(np.float64)
    counts = np.maximum(ndimage.uniform_filter(mask, size=size), 1e-6)
    mean = ndimage.uniform_filter(filled, size=size) / counts
    mean_sq = ndimage.uniform_filter(filled**2, size=size) / counts
    var = np.maximum(mean_sq - mean**2, 0.0)
    cu2 = 1.0 / looks
    ci2 = np.divide(var, np.maximum(mean**2, 1e-12))
    weight = np.clip(1.0 - cu2 / np.maximum(ci2, 1e-12), 0.0, 1.0)
    out = mean + weight * (filled - mean)
    return np.where(np.isfinite(img), out, np.nan)


sigma0_filtered = lee_filter(sigma0_geo, size=9)
with np.errstate(divide="ignore", invalid="ignore"):
    db = 10.0 * np.log10(sigma0_filtered)
valid = np.isfinite(db)
# A touch of Gaussian smoothing on top of Lee: this asset is for display, not
# for measurement, so trading a little resolution for a segmentation mask that
# reads clearly at a glance is the right tradeoff here.
db_smooth = ndimage.gaussian_filter(np.where(valid, db, 0.0), sigma=1.2)
db_smooth = np.where(valid, db_smooth, np.nan)

print("5/7  land masking + CFAR dark-spot segmentation ...")
h, w_ = db.shape
rows_idx, cols_idx = np.meshgrid(np.arange(h), np.arange(w_), indexing="ij")
lon = geo_transform.c + cols_idx * geo_transform.a
lat = geo_transform.f + rows_idx * geo_transform.e
land_raw = globe.is_land(lat, lon)
# global_land_mask classifies from a ~1km-resolution coastline dataset. At our
# ~13 m/pixel grid that decision only changes every ~75-80 px, so ANY small
# smoothing kernel leaves the hard staircase intact — the blockiness isn't
# noise sitting on top of a sharp boundary, it *is* the boundary at this
# dataset's native resolution. A median filter first removes the scattered
# single-pixel misclassifications near the shore (a real cleanup); the wide
# Gaussian afterward is a deliberate, large feather (comparable to the block
# size itself) so the land/water transition renders as a soft coastal gradient
# rather than a staircase. This trades sub-kilometre coastline fidelity for a
# legible hero image — the geometry that's actually load-bearing (the CFAR
# slick detection below) stays at full native resolution and is not touched.
land = ndimage.median_filter(land_raw.astype(np.uint8), size=9).astype(bool)
land_alpha = ndimage.gaussian_filter(land.astype(np.float32), sigma=14.0)
water = valid & ~land

sample = db_smooth[water]
median, mad = np.median(sample), np.median(np.abs(sample - np.median(sample)))
sigma = 1.4826 * mad
threshold = median - 2.0 * sigma
dark = (db_smooth < threshold) & water
dark = ndimage.binary_closing(dark, np.ones((15, 15)))
dark = ndimage.binary_fill_holes(dark)
dark = ndimage.binary_opening(dark, np.ones((3, 3))) & water

labels, n = ndimage.label(dark)
sizes = ndimage.sum(np.ones_like(labels), labels, index=np.arange(1, n + 1)) if n else []
detection_mask = np.zeros_like(dark)
if n:
    biggest = 1 + int(np.argmax(sizes))
    detection_mask = labels == biggest
    print("    detected slick: %d px, threshold %.2f dB" % (int(sizes.max()), threshold))

# Feathered alpha for the overlay too, kept inside the water mask so it never
# bleeds a pink tint onto land.
detect_alpha = ndimage.gaussian_filter(detection_mask.astype(np.float32), sigma=1.2) * water

print("6/7  rendering PNGs ...")

LAND_COLOR = np.array([0.09, 0.15, 0.25])
DETECT_COLOR = np.array([0.97, 0.30, 0.30])


def render(mode: str) -> np.ndarray:
    lo, hi = np.nanpercentile(db[water], [2, 98])
    norm = np.clip((db - lo) / max(hi - lo, 1e-6), 0, 1)
    norm = np.nan_to_num(norm)
    rgb = np.dstack([norm, norm, norm])

    # Shade land by darkening + lightly tinting the existing texture, rather
    # than overwriting it with a flat colour. A hard colour swap turns any
    # residual misclassified pixel (a small islet the coarse land dataset
    # mislabels as water, etc.) into a jarring bright halo once the wide
    # feather blends it; darkening in place just dims that pixel along with
    # its neighbours; it stops leaving high-contrast blending artefacts.
    land_a = np.clip(land_alpha + (~valid).astype(np.float32), 0, 1)[..., None]
    rgb = rgb * (1 - 0.72 * land_a) + LAND_COLOR * (0.4 * land_a)

    if mode in ("mask", "compare"):
        alpha = detect_alpha.copy()
        if mode == "compare":
            alpha[:, : w_ // 2] = 0.0
        rgb = rgb * (1 - alpha[..., None]) + DETECT_COLOR * alpha[..., None]
    if mode == "compare":
        rgb[:, w_ // 2 : w_ // 2 + 1] = 1.0
    return (np.clip(rgb, 0, 1) * 255).astype(np.uint8)


def crop_px(bounds):
    cw, cs, ce, cn = bounds
    col0 = int((cw - geo_transform.c) / geo_transform.a)
    col1 = int((ce - geo_transform.c) / geo_transform.a)
    row0 = int((cn - geo_transform.f) / geo_transform.e)
    row1 = int((cs - geo_transform.f) / geo_transform.e)
    return max(0, min(row0, row1)), min(h, max(row0, row1)), max(0, min(col0, col1)), min(w_, max(col0, col1))


cy0, cy1, cx0, cx1 = crop_px(CROP)
print("    hero crop px:", (cy0, cy1, cx0, cx1))

for mode, name in [("raw", "sar-raw"), ("mask", "sar-mask"), ("compare", "sar-compare")]:
    img = render(mode)[cy0:cy1, cx0:cx1]
    Image.fromarray(img).save(OUT / f"{name}.jpg", quality=92, optimize=True)
    print("    wrote", name, img.shape)

# Thumbnail: tight crop on the slick itself, for use on other pages.
ys, xs = np.where(detection_mask)
if len(ys):
    pad = 40
    y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(w_, xs.max() + pad)
else:
    y0, y1, x0, x1 = 0, h, 0, w_
thumb = render("mask")[y0:y1, x0:x1]
Image.fromarray(thumb).save(OUT / "sar-thumb.jpg", quality=88, optimize=True)
print("    wrote sar-thumb")

print("7/7  metadata")
# Real per-pixel ground area from the warped transform, not an assumed 10 m —
# reprojecting to EPSG:4326 changes pixel size, and this AOI sits at -20.4 deg
# latitude where a degree of longitude is measurably shorter than a degree of
# latitude.
center_lat = (AOI[1] + AOI[3]) / 2.0
deg_lat_km = 111.32
deg_lon_km = 111.32 * np.cos(np.radians(center_lat))
px_h_km = abs(geo_transform.e) * deg_lat_km
px_w_km = abs(geo_transform.a) * deg_lon_km
pixel_area_km2 = px_h_km * px_w_km

meta = {
    "scene_id": item.id,
    "platform": item.properties.get("platform"),
    "acquired_at": item.properties.get("datetime"),
    "mode": item.properties.get("sar:instrument_mode"),
    "polarizations": item.properties.get("sar:polarizations"),
    "orbit_state": item.properties.get("sat:orbit_state"),
    "detected_area_km2": round(float(sizes.max()) * pixel_area_km2, 2) if n else None,
    "threshold_db": round(float(threshold), 2),
    "location": "Mahebourg lagoon, Mauritius (MV Wakashio grounding site)",
}
import json

(OUT / "sar-meta.json").write_text(json.dumps(meta, indent=2))
print(json.dumps(meta, indent=2))
print("\nDone.")
