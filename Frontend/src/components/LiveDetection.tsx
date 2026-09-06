"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Layers, AlertTriangle, ShieldAlert, Loader2, Ruler } from "lucide-react";
import clsx from "clsx";
import { Badge, ProgressBar } from "@/components/ui";
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

type Mode = "raw" | "overlay" | "mask";

const MODE_LABEL: Record<Mode, string> = {
  raw: "Raw Scene",
  overlay: "Overlay",
  mask: "Oil Mask",
};

export default function LiveDetection({ height = 420 }: { height?: number }) {
  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<Mode>("overlay");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sceneUrlRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Object URLs and the interval both outlive React's render, so they have to
  // be torn down explicitly or an unmount mid-job leaks both.
  useEffect(() => {
    return () => {
      stopPolling();
      if (sceneUrlRef.current) URL.revokeObjectURL(sceneUrlRef.current);
    };
  }, [stopPolling]);

  const handleFile = useCallback(
    async (file: File) => {
      stopPolling();
      setUploadError(null);
      setResult(null);
      setJob(null);
      setUploading(true);
      setMode("overlay");

      if (sceneUrlRef.current) URL.revokeObjectURL(sceneUrlRef.current);
      const url = URL.createObjectURL(file);
      sceneUrlRef.current = url;
      setSceneUrl(url);
      setFilename(file.name);

      try {
        const { job_id } = await createJob(file);

        pollRef.current = setInterval(async () => {
          try {
            const status = await fetchJobStatus(job_id);
            setJob(status);

            if (TERMINAL_STATES.includes(status.status)) {
              stopPolling();
              // Only "done" has a result body; the other terminal states carry
              // their explanation on the status object itself.
              if (status.status === "done") {
                setResult(await fetchJobResult(job_id));
              }
            }
          } catch (err) {
            stopPolling();
            setUploadError(err instanceof Error ? err.message : String(err));
          }
        }, POLL_MS);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : String(err));
      } finally {
        setUploading(false);
      }
    },
    [stopPolling]
  );

  const running = job !== null && !TERMINAL_STATES.includes(job.status);
  const busy = uploading || running;
  const detections = result?.detections ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              // Reset so re-picking the same file fires onChange again.
              e.target.value = "";
            }}
          />
        </label>

        {filename && (
          <p className="text-[11px] text-muted font-mono truncate max-w-[50%]">{filename}</p>
        )}

        {job?.status === "done" && (
          <Badge tone={detections.length > 0 ? "danger" : "success"}>
            {detections.length > 0
              ? `${detections.length} slick${detections.length > 1 ? "s" : ""} detected`
              : "No oil detected"}
          </Badge>
        )}

        {job?.status === "done" && detections.length > 0 && (
          <Link
            href={`/dashboard/characterization?job=${job.job_id}`}
            className="flex items-center gap-1.5 text-[11px] text-accent hover:underline"
          >
            <Ruler className="h-3 w-3" />
            View Characterization
          </Link>
        )}
      </div>

      {running && (
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-muted">{job?.message ?? "queued"}</span>
            <span className="font-mono text-accent">{Math.round((job?.progress ?? 0) * 100)}%</span>
          </div>
          <ProgressBar value={(job?.progress ?? 0) * 100} />
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not reach the inference API</p>
            <p className="mt-0.5 text-danger/80 leading-relaxed">{uploadError}</p>
          </div>
        </div>
      )}

      {job?.status === "failed" && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Inference failed</p>
            <p className="mt-0.5 text-danger/80 leading-relaxed font-mono">
              {job.error ?? "no error detail returned"}
            </p>
          </div>
        </div>
      )}

      {/* Rejected is the OOD guard doing its job, not a crash — the scene was
          understood and declined, so it reads as a warning with the reason. */}
      {job?.status === "rejected" && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Scene rejected before inference</p>
            <p className="mt-0.5 text-warning/80 leading-relaxed">
              {job.message ?? "input did not pass the distribution check"}
            </p>
          </div>
        </div>
      )}

      {sceneUrl && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-background" style={{ height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sceneUrl}
            alt={`Uploaded SAR scene${filename ? ` — ${filename}` : ""}`}
            className={clsx(
              "h-full w-full object-contain transition-opacity",
              mode === "mask" ? "opacity-20" : "opacity-100"
            )}
          />

          {/* The mask is white-on-black, so it drives a CSS luminance mask over
              a flat danger fill: white pixels paint, black pixels drop out.
              Cheaper and sharper than recolouring the PNG through a canvas. */}
          {job?.status === "done" && mode !== "raw" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-danger"
              style={{
                opacity: mode === "mask" ? 0.95 : 0.6,
                maskImage: `url(${maskUrl(job.job_id)})`,
                WebkitMaskImage: `url(${maskUrl(job.job_id)})`,
                maskMode: "luminance",
                WebkitMaskComposite: "source-over",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          )}

          {job?.status === "done" && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
              <div className="flex gap-1 rounded-md bg-background/70 backdrop-blur p-1 border border-border">
                {(["raw", "overlay", "mask"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      mode === m ? "bg-accent text-background" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
              {result && (
                <div className="flex items-center gap-1 rounded-md bg-background/70 backdrop-blur px-2 py-1 text-[10px] text-muted border border-border">
                  <Layers className="h-3 w-3" />
                  {result.scene_shape[0]}×{result.scene_shape[1]} px ·{" "}
                  {result.georeferenced ? result.crs ?? "georeferenced" : "unreferenced"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {job?.status === "done" && <DetectionTable detections={detections} />}

      {result && !result.georeferenced && detections.length > 0 && (
        <p className="text-[11px] text-muted leading-relaxed">
          Input carried no geotransform — area in km² assumes a {result.pixel_spacing_m ?? 10} m/px ground
          sampling distance (Sentinel-1 GRD IW) and is an estimate, not a measurement. Map placement stays
          unavailable. Upload a GeoTIFF for measured area and georeferenced output.
        </p>
      )}
    </div>
  );
}

function DetectionTable({ detections }: { detections: Detection[] }) {
  if (detections.length === 0) {
    return (
      <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
        No slicks above the confidence and size thresholds in this scene.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-[11px] text-muted">
            <th className="pb-2 pr-3 font-medium">#</th>
            <th className="pb-2 pr-3 font-medium">Area</th>
            <th className="pb-2 pr-3 font-medium">Confidence</th>
            <th className="pb-2 pr-3 font-medium">Elongation</th>
            <th className="pb-2 pr-3 font-medium">Orientation</th>
            <th className="pb-2 font-medium">Look-alike border</th>
          </tr>
        </thead>
        <tbody>
          {detections.map((d, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="py-2.5 pr-3 text-muted">{i + 1}</td>
              <td className="py-2.5 pr-3 font-medium">
                {d.area_km2 !== null ? (
                  <>
                    {d.area_km2} km²
                    {d.area_estimated && (
                      <span className="ml-1 font-normal text-muted">est.</span>
                    )}
                  </>
                ) : (
                  `${d.pixel_count.toLocaleString()} px`
                )}
              </td>
              <td className="py-2.5 pr-3">
                <Badge tone={d.mean_confidence >= 0.75 ? "danger" : "warning"}>
                  {(d.mean_confidence * 100).toFixed(1)}%
                </Badge>
              </td>
              <td className="py-2.5 pr-3 font-mono text-muted">
                {d.elongation !== null ? `${d.elongation}×` : "—"}
              </td>
              <td className="py-2.5 pr-3 font-mono text-muted">
                {d.orientation_deg !== null ? `${d.orientation_deg}°` : "—"}
              </td>
              <td className="py-2.5">
                {/* High look-alike border fraction is the model's own hint that
                    this slick sits in confusable territory. */}
                <Badge tone={d.lookalike_border_frac > 0.3 ? "warning" : "default"}>
                  {(d.lookalike_border_frac * 100).toFixed(1)}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
