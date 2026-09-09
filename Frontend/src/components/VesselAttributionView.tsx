"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Anchor,
  Radar,
  Ship,
} from "lucide-react";
import clsx from "clsx";
import MapView, { MapVessel } from "@/components/MapView";
import { Card, Badge } from "@/components/ui";
import {
  createJob,
  fetchJobResult,
  fetchJobStatus,
  TERMINAL_STATES,
  type AttributedVessel,
  type JobResult,
  type JobStatus,
} from "@/lib/inference";

const POLL_MS = 1500;

/** Detection.geometry is `unknown` at the API boundary - only a real ring
 *  when the scene was georeferenced. */
function centroidOf(geometry: unknown): [number, number] | null {
  if (!geometry || typeof geometry !== "object") return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type !== "Polygon" || !Array.isArray(g.coordinates) || !Array.isArray(g.coordinates[0])) {
    return null;
  }
  const ring = g.coordinates[0] as [number, number][];
  if (ring.length === 0) return null;
  return [
    ring.reduce((sum, p) => sum + p[0], 0) / ring.length,
    ring.reduce((sum, p) => sum + p[1], 0) / ring.length,
  ];
}

type Match = {
  detectionIndex: number;
  vessel: AttributedVessel;
  slickCenter: [number, number];
  slickRing: [number, number][];
};

function matchesFromResult(result: JobResult): Match[] {
  const matches: Match[] = [];
  result.detections.forEach((d, i) => {
    if (!d.attributed_vessel) return;
    const center = centroidOf(d.geometry);
    if (!center) return;
    const g = d.geometry as { coordinates: [number, number][][] };
    matches.push({
      detectionIndex: i,
      vessel: d.attributed_vessel,
      slickCenter: center,
      slickRing: g.coordinates[0],
    });
  });
  return matches.sort((a, b) => b.vessel.confidence - a.vessel.confidence);
}

export default function VesselAttributionView({ initialJobId }: { initialJobId?: string }) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMmsi, setSelectedMmsi] = useState<number | null>(null);

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
              const m = matchesFromResult(res);
              setSelectedMmsi(m[0]?.vessel.mmsi ?? null);
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

  // A job_id handed in via the URL (from Spill Detection's upload flow, if it
  // was run with "Attribute vessel" checked) already has a scene on the
  // server - pick up its status directly instead of asking to upload again.
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
            const res = await fetchJobResult(initialJobId);
            setResult(res);
            const m = matchesFromResult(res);
            setSelectedMmsi(m[0]?.vessel.mmsi ?? null);
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
      setSelectedMmsi(null);
      setUploading(true);

      try {
        // This page's whole purpose is attribution, so it always requests it -
        // no separate checkbox to forget to tick.
        const { job_id } = await createJob(file, { attributeVessels: true });
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
  const matches = result ? matchesFromResult(result) : [];
  const selected = matches.find((m) => m.vessel.mmsi === selectedMmsi) ?? matches[0];

  const mapVessels: MapVessel[] = matches.map((m) => ({
    id: String(m.vessel.mmsi),
    name: m.vessel.name ?? `MMSI ${m.vessel.mmsi}`,
    lng: m.vessel.lon,
    lat: m.vessel.lat,
    course: m.vessel.cog_deg,
    score: Math.round(m.vessel.confidence * 100),
    popupHtml: `<div style="font-size:12px;font-family:sans-serif;"><strong>${
      m.vessel.name ?? `MMSI ${m.vessel.mmsi}`
    }</strong><br/>${m.vessel.distance_km} km from slick<br/>Confidence: ${Math.round(m.vessel.confidence * 100)}%</div>`,
  }));
  const correlationLines = matches.map((m) => [[m.vessel.lon, m.vessel.lat], m.slickCenter] as [number, number][]);

  return (
    <div className="space-y-5">
      <Card
        title="Scene"
        subtitle="Upload a georeferenced SAR scene to match its slicks against live AIS traffic"
        icon={Upload}
      >
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
              accept=".tif,.tiff"
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
            <Badge tone={matches.length > 0 ? "danger" : "default"}>
              {matches.length > 0
                ? `${matches.length} vessel match${matches.length > 1 ? "es" : ""}`
                : "No AIS match"}
            </Badge>
          )}
        </div>

        <p className="mt-3 text-[11px] text-muted leading-relaxed">
          Matching uses live AIS (aisstream.io) at the moment the scene is processed - there&apos;s no historical
          archive, so this only finds a vessel that happens to be transmitting right now, near the scene.
          Needs a GeoTIFF; a plain PNG/JPG has no coordinates to match against.
        </p>

        {running && (
          <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-muted">{job?.message ?? "queued"}</span>
              <span className="font-mono text-accent">{Math.round((job?.progress ?? 0) * 100)}%</span>
            </div>
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

        {result?.vessel_attribution_warning && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Vessel attribution unavailable</p>
              <p className="mt-0.5 text-warning/80">{result.vessel_attribution_warning}</p>
            </div>
          </div>
        )}
      </Card>

      {job?.status === "done" && !result?.vessel_attribution_warning && matches.length === 0 && (
        <Card title="No Matches" icon={Anchor}>
          <p className="text-xs text-muted">
            No vessel transmitting live AIS near this scene lined up with a detected slick, within{" "}
            8 km and roughly along its heading.
          </p>
        </Card>
      )}

      {selected && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card
              title="AIS + SAR Correlation Map"
              subtitle="Live vessel positions overlaid on detected slick extent"
              icon={Radar}
              className="lg:col-span-2"
            >
              <MapView
                key={`${job?.job_id}-${selectedMmsi}`}
                height={420}
                showSlick
                showVessels
                slickPolygon={selected.slickRing}
                slickCenter={selected.slickCenter}
                slickPopupHtml={`<div style="font-size:12px;font-family:sans-serif;"><strong>Detection #${
                  selected.detectionIndex + 1
                }</strong></div>`}
                vessels={mapVessels}
                correlationLines={correlationLines}
                highlightVesselId={String(selected.vessel.mmsi)}
              />
            </Card>

            <Card title="Suspect Ranking" subtitle={`${matches.length} live AIS match${matches.length > 1 ? "es" : ""}`} icon={ShieldAlert}>
              <div className="space-y-2">
                {matches.map((m, i) => (
                  <button
                    key={m.vessel.mmsi}
                    onClick={() => setSelectedMmsi(m.vessel.mmsi)}
                    className={clsx(
                      "w-full text-left rounded-lg border p-2.5 transition-colors",
                      m.vessel.mmsi === selectedMmsi
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface-2 hover:border-muted"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold shrink-0">
                          #{i + 1}
                        </span>
                        <p className="text-xs font-medium truncate">
                          {m.vessel.name ?? `MMSI ${m.vessel.mmsi}`}
                        </p>
                      </div>
                      <Badge tone={m.vessel.confidence > 0.7 ? "danger" : m.vessel.confidence > 0.4 ? "warning" : "default"}>
                        {Math.round(m.vessel.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted mt-1 ml-7">
                      {m.vessel.distance_km} km away · detection #{m.detectionIndex + 1}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card title={`Match Basis — ${selected.vessel.name ?? `MMSI ${selected.vessel.mmsi}`}`} subtitle="Live AIS proximity + heading alignment, not a reconstructed history" icon={Ship}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">MMSI</p><p className="font-medium mt-1 font-mono">{selected.vessel.mmsi}</p></div>
              <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Distance to slick</p><p className="font-medium mt-1">{selected.vessel.distance_km} km</p></div>
              <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Course / Speed</p><p className="font-medium mt-1">{selected.vessel.cog_deg}° / {selected.vessel.sog_knots ?? "—"}kt</p></div>
              <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Confidence</p><p className="font-medium mt-1">{Math.round(selected.vessel.confidence * 100)}%</p></div>
            </div>
            <p className="mt-3 text-[11px] text-muted leading-relaxed">
              Selected because it was the nearest vessel transmitting live AIS ({selected.vessel.distance_km} km)
              whose course over ground roughly lines up with the slick&apos;s long axis - not from any
              historical track, AIS gap, or vessel-class scoring.
            </p>
          </Card>
        </>
      )}

      {!job && !initialJobId && (
        <p className="text-xs text-muted">
          No scene loaded yet. Upload a GeoTIFF above, or run one from{" "}
          <Link href="/dashboard/detection" className="text-accent hover:underline">
            Spill Detection
          </Link>{" "}
          with &quot;Attribute vessel (live AIS)&quot; checked.
        </p>
      )}
    </div>
  );
}
