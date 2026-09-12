import Topbar from "@/components/Topbar";
import { Card, Badge } from "@/components/ui";
import { FlaskConical, BarChart3, AlertCircle } from "lucide-react";

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border bg-surface-2/40 px-4 py-8 text-center">
      <AlertCircle className="h-6 w-6 text-muted opacity-40" />
      <p className="text-xs text-muted max-w-[240px] leading-relaxed">{message}</p>
    </div>
  );
}

export default function OilTypePage() {
  return (
    <>
      <Topbar title="Oil Type Identification" subtitle="Answer: What kind of oil? — Multispectral matching" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="Spectral Signature Match" subtitle="Observed slick reflectance vs. reference crude library" icon={BarChart3} className="lg:col-span-2">
            <EmptyBox message="Spectral signature chart populates once a confirmed slick is analysed. Process a SAR scene on the Detection page first." />
          </Card>

          <Card title="Classification Result" icon={FlaskConical}>
            <EmptyBox message="Oil type classification runs automatically after a spill is confirmed and characterised." />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="Model Details" subtitle="Gradient-boosted spectral index classifier" icon={FlaskConical} className="lg:col-span-2">
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

          <div className="rounded-xl border border-border bg-surface p-4 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle className="h-6 w-6 text-muted opacity-40" />
            <p className="text-xs text-muted">Process a detection job to see the SAR scene thumbnail here.</p>
          </div>
        </div>
      </main>
    </>
  );
}
