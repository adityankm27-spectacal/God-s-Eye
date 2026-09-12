"use client";

import { useCallback, useMemo, useState } from "react";
import Topbar from "@/components/Topbar";
import MapView from "@/components/MapView";
import LiveDetection, { type LiveDetectionState } from "@/components/LiveDetection";
import { Card, Badge, Stat } from "@/components/ui";
import {
  Satellite,
  CheckCircle2,
  Cpu,
  Upload,
  MapPin,
  AlertCircle,
  Loader2,
  Filter,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function EmptyBox({
  icon: Icon,
  message,
  height,
}: {
  icon: React.ElementType;
  message: string;
  height?: number | string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border bg-surface-2/40 text-center"
      style={height ? { height } : { padding: "2rem 1rem" }}
    >
      <Icon className="h-7 w-7 text-muted opacity-40" />
      <p className="text-xs text-muted max-w-[240px] leading-relaxed whitespace-pre-line">
        {message}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DetectionPage() {
  const [live, setLive] = useState<LiveDetectionState>({ job: null, result: null });
  const [liveSceneUrl, setLiveSceneUrl] = useState<string | null>(null);
  const [liveFilename, setLiveFilename] = useState<string | null>(null);

  const handleLiveStateChange = useCallback((s: LiveDetectionState) => setLive(s), []);
  const handleSceneChange = useCallback(
    (sceneUrl: string | null, filename: string | null) => {
      setLiveSceneUrl(sceneUrl);
      setLiveFilename(filename);
    },
    []
  );

  const { job: liveJob, result: liveResult } = live;
  const liveDetections = liveResult?.detections ?? [];
  const liveDone = liveJob?.status === "done";
  const liveRunning =
    liveJob !== null &&
    liveJob.status !== "done" &&
    liveJob.status !== "failed" &&
    liveJob.status !== "rejected";

  // Georeferenced polygon extraction
  const liveGeoDetection = useMemo(
    () => liveDetections.find((d) => d.geometry != null) ?? null,
    [liveDetections]
  );

  const livePolygon = useMemo(() => {
    if (!liveResult?.georeferenced) return null;
    for (const feature of liveResult.geojson?.features ?? []) {
      const f = feature as { geometry?: { type?: string; coordinates?: unknown } };
      const geom = f?.geometry;
      if (!geom) continue;
      if (geom.type === "Polygon") {
        const coords = (geom.coordinates as [number, number][][])[0];
        if (coords?.length) return coords;
      }
      if (geom.type === "MultiPolygon") {
        const coords = ((geom.coordinates as [number, number][][][])[0] ?? [])[0];
        if (coords?.length) return coords;
      }
    }
    const geom = liveGeoDetection?.geometry as
      | { type: string; coordinates: unknown }
      | null
      | undefined;
    if (geom?.type === "Polygon") {
      const ring = (geom.coordinates as [number, number][][])[0];
      return ring as [number, number][];
    }
    return null;
  }, [liveResult, liveGeoDetection]);

  const livePolygonCenter = useMemo(() => {
    if (!livePolygon || livePolygon.length === 0) return null;
    const lng = livePolygon.reduce((sum, [x]) => sum + x, 0) / livePolygon.length;
    const lat = livePolygon.reduce((sum, [, y]) => sum + y, 0) / livePolygon.length;
    return [lng, lat] as [number, number];
  }, [livePolygon]);

  return (
    <>
      <Topbar title="Spill Detection" subtitle="Satellite acquisition → AI segmentation → real-slick filtering" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        {/* Live Inference upload */}
        <Card
          title="Live Inference — Upload a Scene"
          subtitle="DeepLabv3+ segmentation · 5-class (sea / oil / look-alike / ship / land)"
          icon={Upload}
        >
          <LiveDetection
            height={420}
            onStateChange={handleLiveStateChange}
            onSceneChange={handleSceneChange}
          />
        </Card>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* SAR Scene card */}
          <Card
            title="SAR Scene"
            subtitle={
              liveResult
                ? `${liveResult.georeferenced ? liveResult.crs ?? "Georeferenced" : "Unreferenced raster"} · ${
                    liveResult.pixel_spacing_m ? `${liveResult.pixel_spacing_m}m spacing` : "Pixel spacing"
                  } · ${liveResult.scene_shape[0]}×${liveResult.scene_shape[1]} px`
                : liveFilename
                ? liveFilename
                : "Upload a scene to populate this view"
            }
            icon={Satellite}
            className="lg:col-span-2"
          >
            {liveSceneUrl ? (
              <div
                className="relative rounded-lg overflow-hidden border border-border bg-surface-2"
                style={{ height: 420 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={liveSceneUrl}
                  alt={liveFilename ?? "Uploaded SAR Scene"}
                  className="h-full w-full object-contain"
                />
                {liveFilename && (
                  <div className="absolute top-2 left-2 rounded-md bg-background/80 backdrop-blur px-2.5 py-1 text-[11px] font-mono text-foreground border border-border">
                    {liveFilename}
                  </div>
                )}
              </div>
            ) : (
              <EmptyBox
                icon={Satellite}
                message={"Upload a SAR scene above to view it\nhere."}
                height={420}
              />
            )}

            {liveResult && (
              <p className="mt-2 text-[11px] text-muted leading-relaxed">
                {liveResult.georeferenced
                  ? `Calibrated SAR backscatter georeferenced to ${liveResult.crs ?? "coordinate system"}. Ground sampling distance: ${liveResult.pixel_spacing_m ?? 10} m/px.`
                  : "Input carried no geotransform (plain raster). Detection is displayed in pixel coordinate space."}
              </p>
            )}
          </Card>

          {/* Right column */}
          <div className="space-y-5">
            {/* Answer: Is there an oil spill? */}
            <Card title="Answer: Is there an oil spill?" icon={CheckCircle2}>
              {!liveJob && (
                <EmptyBox
                  icon={AlertCircle}
                  message="Upload a SAR scene above to get a live answer."
                />
              )}

              {liveRunning && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 border border-accent">
                    <Loader2 className="h-5 w-5 text-accent animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Processing Scene…</p>
                    <p className="text-xs text-muted">{liveJob.message ?? "Running inference pipeline"}</p>
                  </div>
                </div>
              )}

              {liveDone && (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                        liveDetections.length > 0
                          ? "bg-danger/15 border-danger"
                          : "bg-accent-2/15 border-accent-2"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-6 w-6 ${liveDetections.length > 0 ? "text-danger" : "text-accent-2"}`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-lg font-semibold ${
                          liveDetections.length > 0 ? "text-danger" : "text-accent-2"
                        }`}
                      >
                        {liveDetections.length > 0
                          ? `Yes — ${liveDetections.length} slick${liveDetections.length > 1 ? "s" : ""} detected`
                          : "No oil detected"}
                      </p>
                      <p className="text-xs text-muted">
                        {liveJob.filename ?? "uploaded scene"}
                        {liveJob.finished_at ? ` · ${new Date(liveJob.finished_at).toISOString().slice(0, 10)}` : ""}
                      </p>
                    </div>
                  </div>
                  {liveDetections.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-surface-2 p-2">
                        <p className="text-muted">Largest slick</p>
                        <p className="font-medium">
                          {liveDetections[0].area_km2 !== null
                            ? `${liveDetections[0].area_km2} km²${liveDetections[0].area_estimated ? " (est.)" : ""}`
                            : `${liveDetections[0].pixel_count.toLocaleString()} px`}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-2 p-2">
                        <p className="text-muted">Mean confidence</p>
                        <p className="font-medium">
                          {(liveDetections[0].mean_confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {liveJob?.status === "rejected" && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Scene rejected before inference</p>
                    <p className="mt-0.5 text-warning/80">{liveJob.message ?? "Out of distribution"}</p>
                  </div>
                </div>
              )}

              {liveJob?.status === "failed" && (
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Inference failed</p>
                    <p className="mt-0.5 text-danger/80">{liveJob.error ?? "Pipeline execution error"}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Look-Alike Filtering */}
            <Card
              title="Look-Alike Filtering"
              subtitle="AI-based false-positive rejection"
              icon={Filter}
            >
              <div className="space-y-3">
                {[
                  "Low-wind area mimic",
                  "Ship wake pattern",
                  "Natural biogenic slick (algae)",
                  "Rain cell / atmospheric front",
                ].map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-xl bg-surface-2/90 px-4 py-3 border border-border/30"
                  >
                    <span className="text-sm font-medium text-foreground/90">
                      {category}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                      Ruled out
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Live Detection Map */}
          <Card
            title="Live Detection Map"
            subtitle={
              livePolygon
                ? `${liveDetections.length} slick${liveDetections.length !== 1 ? "s" : ""} · ${liveResult?.crs ?? "georeferenced"}`
                : liveResult && !liveResult.georeferenced
                ? "Scene not georeferenced — map placement unavailable"
                : "Awaiting upload"
            }
            icon={Satellite}
            className="lg:col-span-2"
          >
            {livePolygon && livePolygonCenter ? (
              <MapView
                height={320}
                showSlick
                slickPolygon={livePolygon}
                slickCenter={livePolygonCenter}
                slickPopupHtml={`${liveGeoDetection?.area_km2 ?? "?"} km² · ${((liveGeoDetection?.mean_confidence ?? 0) * 100).toFixed(0)}% confidence`}
                center={livePolygonCenter}
                zoom={9}
              />
            ) : (
              <EmptyBox
                icon={MapPin}
                message={"Upload a scene above to see its\ndetection here."}
                height={320}
              />
            )}

            {liveResult && !liveResult.georeferenced && (
              <p className="mt-2 text-[11px] text-muted leading-relaxed">
                The uploaded scene carries no geotransform, so the detection cannot be placed on the geographic map. Upload a GeoTIFF for georeferenced coordinate output.
              </p>
            )}
          </Card>

          {/* Scene Diagnostics */}
          <Card
            title="Scene Diagnostics"
            subtitle={
              liveJob
                ? `Job ${liveJob.status}${liveJob.message ? ` · ${liveJob.message}` : ""}`
                : "Real pipeline fields from the completed job"
            }
            icon={Cpu}
          >
            {liveResult ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Georeferenced" value={liveResult.georeferenced ? "Yes" : "No"} />
                  <Stat label="CRS" value={liveResult.crs ?? "—"} />
                  <Stat
                    label="Scene Shape"
                    value={`${liveResult.scene_shape[0]}×${liveResult.scene_shape[1]} px`}
                  />
                  <Stat
                    label="Pixel Spacing"
                    value={
                      liveResult.pixel_spacing_m
                        ? `${liveResult.pixel_spacing_m} m${liveResult.area_estimated ? " (est.)" : ""}`
                        : "—"
                    }
                  />
                  <Stat label="Detections" value={String(liveDetections.length)} />
                  <Stat
                    label="Vessel Attribution"
                    value={
                      liveResult.vessel_attribution_enabled
                        ? liveResult.vessel_attribution_warning
                          ? "Unavailable"
                          : "Enabled"
                        : "Not requested"
                    }
                  />
                </div>
                {liveJob?.job_id && (
                  <p className="mt-3 text-[10px] text-muted font-mono border-t border-border pt-3">
                    job {liveJob.job_id}
                  </p>
                )}
              </>
            ) : (
              <EmptyBox
                icon={AlertCircle}
                message="Run a job above to populate pipeline diagnostics."
              />
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
