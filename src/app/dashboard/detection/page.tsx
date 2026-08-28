import Topbar from "@/components/Topbar";
import SarViewer from "@/components/SarViewer";
import MapView from "@/components/MapView";
import { Card, Badge, Stat, ProgressBar } from "@/components/ui";
import { activeSpill } from "@/lib/mockData";
import { Satellite, CheckCircle2, Cpu, Filter } from "lucide-react";

export default function DetectionPage() {
  return (
    <>
      <Topbar title="Spill Detection" subtitle="Satellite acquisition → AI segmentation → real-slick filtering" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card
            title="SAR Scene — AI Segmentation"
            subtitle="U-Net / DeepLabV3+ dark-spot segmentation on Sentinel-1 pass"
            icon={Satellite}
            className="lg:col-span-2"
          >
            <SarViewer height={420} />
          </Card>

          <div className="space-y-5">
            <Card title="Answer: Is there an oil spill?" icon={CheckCircle2}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 border-2 border-danger">
                  <CheckCircle2 className="h-6 w-6 text-danger" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-danger">Yes — Confirmed Slick</p>
                  <p className="text-xs text-muted">Detected at 04:12 UTC, {activeSpill.satellite}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Segmentation confidence</span>
                  <span className="font-medium">{activeSpill.confidence}%</span>
                </div>
                <ProgressBar value={activeSpill.confidence} tone="danger" />
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
          <Card title="Detection Location" icon={Satellite} className="lg:col-span-2">
            <MapView height={320} showSlick center={[72.1, 19.4]} zoom={7.6} />
          </Card>

          <Card title="Acquisition Metadata" icon={Cpu}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Satellite" value="Sentinel-1A" />
              <Stat label="Sensor Mode" value="IW, VV/VH" />
              <Stat label="Pass Direction" value="Descending" />
              <Stat label="Incidence Angle" value="34.2°" />
              <Stat label="Pixel Spacing" value="10 m" />
              <Stat label="Model" value="U-Net (ResNet34)" />
              <Stat label="Processing Time" value="41 sec" />
              <Stat label="Speckle Filter" value="Lee, 5×5" />
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
