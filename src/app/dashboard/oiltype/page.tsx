import Topbar from "@/components/Topbar";
import Chart from "@/components/Chart";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { activeSpill, spectralSignature } from "@/lib/mockData";
import { FlaskConical, BarChart3 } from "lucide-react";

const candidates = [
  { name: "Medium Crude (API 28–32)", score: 87.5 },
  { name: "Heavy Fuel Oil (HFO)", score: 8.2 },
  { name: "Diesel / Light Distillate", score: 3.1 },
  { name: "Vegetable / Biogenic Oil", score: 1.2 },
];

export default function OilTypePage() {
  return (
    <>
      <Topbar title="Oil Type Identification" subtitle="Answer: What kind of oil? — Multispectral / hyperspectral matching" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="Spectral Signature Match" subtitle="Observed slick reflectance vs. reference crude library" icon={BarChart3} className="lg:col-span-2">
            <Chart
              data={[
                {
                  x: spectralSignature.wavelengths,
                  y: spectralSignature.observed,
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Observed (slick)",
                  line: { color: "#f87171" },
                },
                {
                  x: spectralSignature.wavelengths,
                  y: spectralSignature.reference,
                  type: "scatter",
                  mode: "lines",
                  name: "Reference: Medium Crude API 30",
                  line: { color: "#22d3ee", dash: "dot" },
                },
              ]}
              layout={{
                xaxis: { title: { text: "Wavelength (nm)" }, gridcolor: "#1e293b" },
                yaxis: { title: { text: "Reflectance" }, gridcolor: "#1e293b" },
              }}
              height={300}
            />
          </Card>

          <Card title="Classification Result" icon={FlaskConical}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-orange/15 border-2 border-accent-orange">
                <FlaskConical className="h-6 w-6 text-accent-orange" />
              </div>
              <div>
                <p className="text-sm font-semibold">{activeSpill.oilType}</p>
                <p className="text-xs text-muted">{activeSpill.oilTypeConfidence}% match confidence</p>
              </div>
            </div>
            <div className="space-y-3">
              {candidates.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={c.score > 50 ? "text-foreground font-medium" : "text-muted"}>{c.name}</span>
                    <span className="text-muted">{c.score}%</span>
                  </div>
                  <ProgressBar value={c.score} tone={c.score > 50 ? "warning" : "accent"} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Model Details" subtitle="Gradient-boosted spectral index classifier" icon={FlaskConical}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-lg bg-surface-2 p-3">
              <p className="text-muted">Model</p>
              <p className="font-medium mt-1">LightGBM Classifier</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <p className="text-muted">Features</p>
              <p className="font-medium mt-1">Spectral indices (11 bands)</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <p className="text-muted">Training Set</p>
              <p className="font-medium mt-1">1,840 labeled slick samples</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <p className="text-muted">Validation Accuracy</p>
              <p className="font-medium mt-1"><Badge tone="success">91.3%</Badge></p>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
