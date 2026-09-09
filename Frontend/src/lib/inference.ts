/**
 * Client for the God's Eye inference backend (Backend/server.py).
 *
 * The API is job-based rather than request/response because a full scene takes
 * longer than an HTTP connection should be held open: POST a file, then poll
 * until the job reaches a terminal state.
 */

export const INFERENCE_API =
  process.env.NEXT_PUBLIC_INFERENCE_API ?? "http://localhost:8000";

/** queued/running are in-flight; done/failed/rejected are terminal. */
export type JobState = "queued" | "running" | "done" | "failed" | "rejected";

export const TERMINAL_STATES: JobState[] = ["done", "failed", "rejected"];

export type JobStatus = {
  job_id: string;
  status: JobState;
  progress: number;
  message?: string;
  /** Only present when status is "failed". */
  error?: string;
  filename?: string;
  created_at: string;
  finished_at?: string;
};

export type Detection = {
  pixel_count: number;
  mean_confidence: number;
  elongation: number | null;
  orientation_deg: number | null;
  length_px: number | null;
  width_px: number | null;
  compactness?: number | null;
  lookalike_border_frac: number;
  area_km2: number | null;
  /** true when area_km2 came from an ASSUMED pixel spacing (scene had no
   *  geotransform) rather than a measured one. Always surface this — an
   *  assumed area must not be presented as a surveyed one. */
  area_estimated?: boolean;
  /** Ground sampling distance backing area_km2, measured or assumed. */
  pixel_spacing_m?: number | null;
  /** null unless the scene was genuinely georeferenced; an assumed pixel
   *  size yields an area but never a real position. */
  geometry: unknown | null;
  /** Best-matching vessel from a live AIS feed (aisstream.io), or null when
   *  attribution was on but nothing nearby matched. Undefined when
   *  attribution wasn't requested for this job. */
  attributed_vessel?: AttributedVessel | null;
};

export type AttributedVessel = {
  mmsi: number;
  name: string | null;
  lat: number;
  lon: number;
  distance_km: number;
  cog_deg: number;
  sog_knots: number | null;
  /** 0-1 blend of proximity and heading alignment, not a calibrated probability. */
  confidence: number;
};

export type JobResult = {
  georeferenced: boolean;
  crs: string | null;
  scene_shape: number[];
  pixel_spacing_m?: number | null;
  area_estimated?: boolean;
  detections: Detection[];
  geojson: { type: string; features: unknown[] };
  vessel_attribution_enabled?: boolean;
  /** Set when attribution was requested but couldn't run (unreferenced
   *  scene, missing server API key, or the AIS lookup itself failed). */
  vessel_attribution_warning?: string | null;
};

async function expectOk(res: Response, what: string) {
  if (!res.ok) {
    // FastAPI puts the useful part in `detail`; fall back to the status line.
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`${what} failed (${res.status}): ${detail}`);
  }
}

export async function createJob(
  file: File,
  options?: { attributeVessels?: boolean }
): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append("file", file);

  const params = new URLSearchParams();
  if (options?.attributeVessels) params.set("attribute_vessels", "true");

  const res = await fetch(`${INFERENCE_API}/api/jobs?${params}`, {
    method: "POST",
    body: form,
  });
  await expectOk(res, "upload");
  return res.json();
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${INFERENCE_API}/api/jobs/${jobId}`, {
    cache: "no-store",
  });
  await expectOk(res, "status poll");
  return res.json();
}

export async function fetchJobResult(jobId: string): Promise<JobResult> {
  const res = await fetch(`${INFERENCE_API}/api/jobs/${jobId}/result`, {
    cache: "no-store",
  });
  await expectOk(res, "result fetch");
  return res.json();
}

export function maskUrl(jobId: string) {
  return `${INFERENCE_API}/api/jobs/${jobId}/mask.png`;
}
