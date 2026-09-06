"""
God's Eye - inference API.

Wraps sar_inference.py in an async job API so a frontend can upload a scene
without holding an HTTP connection open for minutes.

    uvicorn server:app --reload --port 8000

Contract:
    POST /api/jobs                  -> {job_id, status}
    GET  /api/jobs/{id}             -> {status, progress, error}
    GET  /api/jobs/{id}/result      -> {detections, geojson, georeferenced}
    GET  /api/jobs/{id}/mask.png    -> binary oil mask for overlay
    GET  /api/health                -> {status, model_loaded}

The in-memory job store is fine for a demo and wrong for production - it
dies with the process. Swap JOBS for Redis before anyone depends on it.
"""

import os
import shutil
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

import sar_inference

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL_PATH = os.getenv("MODEL_PATH", "models/deeplab_oil_finetuned.h5")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "data/uploads"))
RESULT_DIR = Path(os.getenv("RESULT_DIR", "data/results"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "500"))

ALLOWED_EXT = {".tif", ".tiff", ".png", ".jpg", ".jpeg"}

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="God's Eye inference API")

# Lock this down before the demo - "*" is fine on localhost, not in a submission
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

JOBS = {}
_MODEL = None


def get_model():
    """Load once, reuse. Loading a 17.8M-param model per request would add
    several seconds to every job and exhaust memory under any concurrency."""
    global _MODEL
    if _MODEL is None:
        from keras.models import load_model
        _MODEL = load_model(MODEL_PATH, compile=False)
    return _MODEL


def _now():
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Worker
# ---------------------------------------------------------------------------

def process_job(job_id, input_path, already_db, pixel_spacing_m=None):
    job = JOBS[job_id]
    try:
        job.update(status="running", progress=0.1, message="loading scene")

        arr, transform, crs = sar_inference.load_input(input_path)
        georeferenced = transform is not None

        # The checkpoint was trained on 8-bit imagery scaled by /255, NOT on
        # calibrated sigma0 dB. Feeding a georeferenced scene through
        # normalise_db() would hand the model a distribution it never saw, so
        # every input takes the 8-bit path regardless of georeferencing.
        # `already_db` is retained on the signature but deliberately unused -
        # restore the branch here if the model is ever retrained on dB.
        norm = sar_inference.normalise_8bit(arr)

        job.update(progress=0.2, message="checking input distribution")
        ok, msg = sar_inference.ood_check(norm)
        if not ok:
            job.update(status="rejected", progress=1.0, message=msg,
                       finished_at=_now())
            return

        job.update(progress=0.3, message="running segmentation")
        probs = sar_inference.predict_scene(get_model(), norm)

        job.update(progress=0.8, message="extracting slicks")
        detections, labels = sar_inference.extract_slicks(
            probs, transform, crs, assumed_pixel_m=pixel_spacing_m
        )

        out_dir = RESULT_DIR / job_id
        out_dir.mkdir(parents=True, exist_ok=True)

        import cv2
        import numpy as np
        mask = (labels == sar_inference.CLASS_OIL).astype(np.uint8) * 255
        cv2.imwrite(str(out_dir / "mask.png"), mask)

        features = [
            {"type": "Feature", "geometry": d["geometry"],
             "properties": {k: v for k, v in d.items() if k != "geometry"}}
            for d in detections if d.get("geometry")
        ]

        job.update(
            status="done",
            progress=1.0,
            message=f"{len(detections)} slick(s) detected",
            finished_at=_now(),
            result={
                "georeferenced": georeferenced,
                "crs": str(crs) if crs else None,
                "scene_shape": list(arr.shape),
                # Ground sampling distance actually used for the area figures
                # above - measured from the geotransform when there is one,
                # otherwise the assumption the caller is relying on.
                "pixel_spacing_m": (detections[0]["pixel_spacing_m"]
                                    if detections else None),
                "area_estimated": not georeferenced,
                "detections": detections,
                "geojson": {"type": "FeatureCollection", "features": features},
            },
        )
    except Exception as exc:
        traceback.print_exc()
        job.update(status="failed", progress=1.0, error=str(exc),
                   finished_at=_now())
    finally:
        # uploads are large; don't accumulate them
        Path(input_path).unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": _MODEL is not None}


@app.post("/api/jobs")
async def create_job(background: BackgroundTasks,
                     file: UploadFile = File(...),
                     linear: bool = False,
                     pixel_spacing_m: float | None = None):
    """pixel_spacing_m only applies to scenes with no geotransform, where it
    sets the assumed ground sampling distance used for area in km2. A
    georeferenced scene measures its own and ignores this."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"unsupported type {ext!r}; "
                                 f"allowed: {sorted(ALLOWED_EXT)}")

    if pixel_spacing_m is not None and pixel_spacing_m <= 0:
        raise HTTPException(400, "pixel_spacing_m must be greater than 0")

    job_id = uuid.uuid4().hex[:12]
    dest = UPLOAD_DIR / f"{job_id}{ext}"

    size = 0
    limit = MAX_UPLOAD_MB * 1024 * 1024
    with dest.open("wb") as fh:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                fh.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, f"file exceeds {MAX_UPLOAD_MB} MB")
            fh.write(chunk)

    JOBS[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0.0,
        "message": "queued",
        "filename": file.filename,
        "created_at": _now(),
    }

    background.add_task(process_job, job_id, str(dest), not linear,
                        pixel_spacing_m)
    return JSONResponse({"job_id": job_id, "status": "queued"}, status_code=202)


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, "unknown job")
    return {k: v for k, v in job.items() if k != "result"}


@app.get("/api/jobs/{job_id}/result")
def job_result(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, "unknown job")
    if job["status"] != "done":
        raise HTTPException(409, f"job is {job['status']}, not done")
    return job["result"]


@app.get("/api/jobs/{job_id}/mask.png")
def job_mask(job_id: str):
    path = RESULT_DIR / job_id / "mask.png"
    if not path.exists():
        raise HTTPException(404, "no mask for this job")
    return FileResponse(path, media_type="image/png")


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str):
    JOBS.pop(job_id, None)
    shutil.rmtree(RESULT_DIR / job_id, ignore_errors=True)
    return {"deleted": job_id}
