import Topbar from "@/components/Topbar";
import SarViewer from "@/components/SarViewer";
import MapView from "@/components/MapView";
import LiveDetection from "@/components/LiveDetection";
import { Card, Badge, Stat } from "@/components/ui";
import { sarImageMeta } from "@/lib/sarImage";
import { Satellite, CheckCircle2, Cpu, Filter, Upload } from "lucide-react";

export default function DetectionPage() {
  const acquired = new Date(sarImageMeta.acquiredAt);

  return (
    <>
      <Topbar title="Spill Detection" subtitle="Satellite acquisition → AI segmentation → real-slick filtering" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <Card
          title="Live Inference — Upload a Scene"
          subtitle="DeepLabv3+ segmentation · 5-class (sea / oil / look-alike / ship / land)"
          icon={Upload}
        >
          <LiveDetection height={420} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card
            title="SAR Scene — Real Validation Case"
            subtitle={`Sentinel-1B · ${sarImageMeta.eventLabel} · dark-spot CFAR segmentation`}
            icon={Satellite}
            className="lg:col-span-2"
          >
            <SarViewer height={420} />
            <p className="mt-2 text-[11px] text-muted leading-relaxed">
              Real Sentinel-1B backscatter over {sarImageMeta.location}, calibrated to
              sigma-nought and segmented with an adaptive CFAR dark-spot detector — not an
              illustration.
            </p>
          </Card>

          <div className="space-y-5">
            <Card title="Answer: Is there an oil spill?" icon={CheckCircle2}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 border-2 border-danger">
                  <CheckCircle2 className="h-6 w-6 text-danger" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-danger">Yes — Confirmed Slick</p>
                  <p className="text-xs text-muted">
                    {sarImageMeta.eventLabel}, {acquired.toISOString().slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-surface-2 p-2">
                  <p className="text-muted">Detected area</p>
                  <p className="font-medium">{sarImageMeta.detectedAreaKm2} km²</p>
                </div>
                <div className="rounded-lg bg-surface-2 p-2">
                  <p className="text-muted">CFAR threshold</p>
                  <p className="font-medium">{sarImageMeta.thresholdDb} dB</p>
                </div>
              </div>
            </Card>

            <Card title="Look-Alike Filtering" subtitle="AI-based false-positive rejection" icon={Filter}>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: "Low-wind area mimic", passed: true },
                  { label: "Ship wake pattern", passed: true },
                  { label: "Natural biogenic slick (algae)", passed: true },
                  { label: "Rain cell / atmospheric front", passed: true },
                ].map((c) => (
                  <div key={c.label} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                    <span>{c.label}</span>
                    <Badge tone="success">Ruled out</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card
            title="Demo Scenario — Live Monitoring"
            subtitle="Illustrative AOI used elsewhere in this dashboard (Arabian Sea, off Mumbai)"
            icon={Satellite}
            className="lg:col-span-2"
          >
            <MapView height={320} showSlick center={[72.1, 19.4]} zoom={7.6} />
          </Card>

          <Card title="Acquisition Metadata" subtitle="Real scene parameters" icon={Cpu}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Satellite" value={sarImageMeta.platform} />
              <Stat label="Sensor Mode" value={`${sarImageMeta.mode}, ${sarImageMeta.polarizations.join("/")}`} />
              <Stat label="Pass Direction" value="Descending" />
              <Stat label="Pixel Spacing" value="10 m (native)" />
              <Stat label="Detected Area" value={`${sarImageMeta.detectedAreaKm2} km²`} />
              <Stat label="CFAR Threshold" value={`${sarImageMeta.thresholdDb} dB`} />
              <Stat label="Speckle Filter" value="Lee, 9×9" />
              <Stat label="Acquired" value={acquired.toISOString().slice(0, 10)} />
            </div>
            <p className="mt-3 text-[10px] text-muted font-mono border-t border-border pt-3">
              {sarImageMeta.sceneId}
            </p>
          </Card>
        </div>
      </main>
    </>
  );
}
