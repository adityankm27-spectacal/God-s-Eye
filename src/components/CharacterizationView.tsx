"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Ruler,
  Gauge,
  ShieldAlert,
  Compass,
  Loader2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import clsx from "clsx";
import MapView from "@/components/MapView";
import { Card, KpiCard, Badge, Stat, ProgressBar } from "@/components/ui";
import {
  createJob,
  fetchJobResult,
  fetchJobStatus,
  maskUrl,
  TERMINAL_STATES,
  type Detection,
  type JobResult,
  type JobStatus,
} from "@/lib/inference";

const POLL_MS = 1500;

/** Detection.geometry is typed `unknown` at the API boundary - it's whatever
 *  contour_to_geojson() produced, which is only a real ring when the scene
 *  was georeferenced. Extract the ring plus a centroid for the marker, or
 *  null if there's nothing valid to plot. */
function extractPolygon(geometry: unknown): { ring: [number, number][]; center: [number, number] } | null {
  if (!geometry || typeof geometry !== "object") return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type !== "Polygon" || !Array.isArray(g.coordinates) || !Array.isArray(g.coordinates[0])) {
    return null;
  }
  const ring = g.coordinates[0] as [number, number][];
  if (ring.length === 0) return null;
  const center: [number, number] = [
    ring.reduce((sum, p) => sum + p[0], 0) / ring.length,
    ring.reduce((sum, p) => sum + p[1], 0) / ring.length,
  ];
  return { ring, center };
}

export default function CharacterizationView({ initialJobId }: { initialJobId?: string }) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const trackJob = useCallback(
    (jobId: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const status = await fetchJobStatus(jobId);
          setJob(status);

          if (TERMINAL_STATES.includes(status.status)) {
            stopPolling();
            if (status.status === "done") {
              const res = await fetchJobResult(jobId);
              setResult(res);
              setSelectedIndex(0);
            }
          }
        } catch (err) {
          stopPolling();
          setError(err instanceof Error ? err.message : String(err));
        }
      }, POLL_MS);
    },
    [stopPolling]
  );

  // A job_id handed in via the URL (from the detection page's upload flow)
  // already has a scene sitting on the server - pick up its status directly
  // instead of asking the user to upload again.
  useEffect(() => {
    if (!initialJobId) return;
    let cancelled = false;

    (async () => {
      try {
        const status = await fetchJobStatus(initialJobId);
        if (cancelled) return;
        setJob(status);
        if (TERMINAL_STATES.includes(status.status)) {
          if (status.status === "done") {
            setResult(await fetchJobResult(initialJobId));
          }
        } else {
          trackJob(initialJobId);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialJobId]);

  const handleFile = useCallback(
    async (file: File) => {
      stopPolling();
      setError(null);
      setResult(null);
      setJob(null);
      setUploading(true);

      try {
        const { job_id } = await createJob(file);
        trackJob(job_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setUploading(false);
      }
    },
    [stopPolling, trackJob]
  );

  const running = job !== null && !TERMINAL_STATES.includes(job.status);
  const busy = uploading || running;
  const detections = result?.detections ?? [];
  const top: Detection | undefined = detections[selectedIndex];
  const geo = top && result?.georeferenced ? extractPolygon(top.geometry) : null;

  return (
    <div className="space-y-5">
      <Card title="Scene" subtitle="Upload a SAR scene, or open one from Spill Detection" icon={Upload}>
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors",
              busy
                ? "bg-surface-2 text-muted cursor-not-allowed"
                : "bg-accent text-background cursor-pointer hover:bg-accent/90"
            )}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {busy ? "Processing…" : "Upload SAR Scene"}
            <input
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </label>

          {job?.filename && <p className="text-[11px] text-muted font-mono truncate">{job.filename}</p>}

          {job?.status === "done" && (
            <Badge tone={detections.length > 0 ? "danger" : "success"}>
              {detections.length > 0
                ? `${detections.length} slick${detections.length > 1 ? "s" : ""} detected`
                : "No oil detected"}
            </Badge>
          )}
        </div>

        {running && (
          <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-muted">{job?.message ?? "queued"}</span>
              <span className="font-mono text-accent">{Math.round((job?.progress ?? 0) * 100)}%</span>
            </div>
            <ProgressBar value={(job?.progress ?? 0) * 100} />
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {job?.status === "failed" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Inference failed</p>
              <p className="mt-0.5 text-danger/80 font-mono">{job.error ?? "no error detail returned"}</p>
            </div>
          </div>
        )}

        {job?.status === "rejected" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Scene rejected before inference</p>
              <p className="mt-0.5 text-warning/80">{job.message ?? "input did not pass the distribution check"}</p>
            </div>
          </div>
        )}
      </Card>

      {job?.status === "done" && detections.length === 0 && (
        <Card title="No Detections" icon={Ruler}>
          <p className="text-xs text-muted">
            No slicks passed the confidence and size thresholds in this scene - there is nothing to characterize.
          </p>
        </Card>
      )}

      {top && (
        <>
          {detections.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{detections.length} detections in this scene:</span>
              {detections.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    i === selectedIndex
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-foreground"
                  )}
                >
                  #{i + 1} ·{" "}
                  {d.area_km2 !== null
                    ? `${d.area_km2} km²${d.area_estimated ? " est." : ""}`
                    : `${d.pixel_count.toLocaleString()} px`}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label={top.area_estimated ? "Slick Area (est.)" : "Slick Area"}
              value={top.area_km2 !== null ? top.area_km2 : top.pixel_count.toLocaleString()}
              unit={top.area_km2 !== null ? "km²" : "px"}
              icon={Ruler}
              trend={
                top.area_estimated && top.pixel_spacing_m
                  ? `assumes ${top.pixel_spacing_m} m/px`
                  : undefined
              }
              trendTone="muted"
            />
            <KpiCard
              label="Confidence"
              value={(top.mean_confidence * 100).toFixed(1)}
              unit="%"
              icon={Gauge}
              tone={top.mean_confidence >= 0.75 ? "danger" : "default"}
            />
            <KpiCard
              label="Elongation"
              value={top.elongation !== null ? top.elongation.toFixed(2) : "—"}
              unit="×"
              icon={Compass}
            />
            <KpiCard
              label="Look-alike Border"
              value={(top.lookalike_border_frac * 100).toFixed(1)}
              unit="%"
              icon={ShieldAlert}
              tone={top.lookalike_border_frac > 0.3 ? "danger" : "default"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card
              title="Segmented Oil Mask"
              subtitle="Model output for the selected detection's scene"
              icon={Ruler}
              className="lg:col-span-2"
            >
              {job && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={maskUrl(job.job_id)}
                  alt="Segmented oil mask"
                  className="w-full rounded-lg border border-border bg-background object-contain"
                  style={{ maxHeight: 380 }}
                />
              )}
              {!result?.georeferenced && (
                <p className="mt-2 text-[11px] text-muted leading-relaxed">
                  Input carried no geotransform. Area in km² is derived from an assumed ground sampling
                  distance of {result?.pixel_spacing_m ?? 10} m/px (Sentinel-1 GRD IW), so it scales with
                  the square of any error in that assumption — treat it as an estimate, not a survey. Map
                  placement stays unavailable, since an assumed pixel size gives no real position. Upload a
                  GeoTIFF for measured area and geometry.
                </p>
              )}
            </Card>

            <Card title="Shape Descriptors" subtitle="From the segmentation contour" icon={Compass}>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Pixel Count" value={top.pixel_count.toLocaleString()} />
                <Stat label="Orientation" value={top.orientation_deg !== null ? `${top.orientation_deg}°` : "—"} />
                <Stat label="Length" value={top.length_px !== null ? `${top.length_px} px` : "—"} />
                <Stat label="Width" value={top.width_px !== null ? `${top.width_px} px` : "—"} />
                <Stat label="Compactness" value={top.compactness != null ? `${top.compactness}` : "—"} />
                <Stat label="Elongation" value={top.elongation !== null ? `${top.elongation}×` : "—"} />
              </div>
            </Card>
          </div>

          {geo && (
            <Card
              title="Detected Location"
              subtitle={`Polygon from the scene's geotransform · ${result?.crs ?? "unknown CRS"}`}
              icon={MapPin}
            >
              <MapView
                key={`${job?.job_id}-${selectedIndex}`}
                height={360}
                showSlick
                slickPolygon={geo.ring}
                slickCenter={geo.center}
                slickPopupHtml={`<div style="font-size:12px;font-family:sans-serif;"><strong>Detection #${selectedIndex + 1}</strong><br/>${
                  top.area_km2 !== null ? `${top.area_km2} km²` : `${top.pixel_count.toLocaleString()} px`
                } · ${(top.mean_confidence * 100).toFixed(1)}% confidence</div>`}
              />
            </Card>
          )}
        </>
      )}

      {!job && !initialJobId && (
        <p className="text-xs text-muted">
          No scene loaded yet. Upload one above, or run a detection from{" "}
          <Link href="/dashboard/detection" className="text-accent hover:underline">
            Spill Detection
          </Link>{" "}
          first.
        </p>
      )}
    </div>
  );
}
