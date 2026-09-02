import Topbar from "@/components/Topbar";
import SarViewer from "@/components/SarViewer";
import Chart from "@/components/Chart";
import { Card, KpiCard, Stat } from "@/components/ui";
import { activeSpill } from "@/lib/mockData";
import { Ruler, Gauge, Waves, Wind } from "lucide-react";

export default function CharacterizationPage() {
  return (
    <>
      <Topbar title="Slick Characterization" subtitle="Answer: How big is it? — Geometry, thickness & volume estimation" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Slick Area" value={activeSpill.areaKm2} unit="km²" icon={Ruler} />
          <KpiCard label="Perimeter" value={activeSpill.perimeterKm} unit="km" icon={Ruler} />
          <KpiCard label="Est. Thickness" value={activeSpill.thicknessMm} unit="mm" icon={Gauge} />
          <KpiCard label="Est. Volume" value={activeSpill.volumeBarrels.toLocaleString()} unit="bbl" icon={Gauge} tone="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="Slick Geometry" subtitle="Segmented boundary from SAR dark-spot mask" icon={Ruler} className="lg:col-span-2">
            <SarViewer height={380} />
          </Card>

          <Card title="Volume Estimation Model" subtitle="Area × thickness proxy (damping-ratio method)" icon={Gauge}>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-muted mb-1">Formula</p>
                <p className="font-mono text-accent-2">V = A × t × 1000</p>
                <p className="text-muted mt-1">A = area (m²), t = thickness (m)</p>
              </div>
              <Stat label="Damping ratio (SAR-derived)" value="0.62" />
              <Stat label="Thickness proxy class" value="Sheen–Medium band" />
              <Stat label="Volume range (±15%)" value="2,650 – 3,590 bbl" />
              <Stat label="Model" value="XGBoost regressor" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Sea & Weather Conditions" subtitle="Copernicus Marine + ERA5 at time of detection" icon={Waves}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Sea State" value={activeSpill.seaState} />
              <Stat label="Wind Speed" value={`${activeSpill.windSpeedKt} kt`} />
              <Stat label="Wind Direction" value={activeSpill.windDir} />
              <Stat label="Water Temp" value="27.4°C" />
              <Stat label="Current Speed" value="0.6 kt (NE-set)" />
              <Stat label="Wave Height (Hs)" value="1.2 m" />
            </div>
          </Card>

          <Card title="Area Growth Projection" subtitle="Modelled spread over next 12 hours" icon={Wind}>
            <Chart
              data={[
                {
                  x: ["+0h", "+2h", "+4h", "+6h", "+8h", "+10h", "+12h"],
                  y: [18.4, 20.1, 22.8, 25.9, 29.2, 32.5, 35.7],
                  type: "scatter",
                  mode: "lines+markers",
                  fill: "tozeroy",
                  line: { color: "#fb923c" },
                  name: "Area (km²)",
                },
              ]}
            />
          </Card>
        </div>
      </main>
    </>
  );
}
