import Topbar from "@/components/Topbar";
import MapView from "@/components/MapView";
import { Card } from "@/components/ui";
import { Waves, History, TrendingUp, MapPinned, AlertCircle } from "lucide-react";

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border bg-surface-2/40 px-4 py-8 text-center">
      <AlertCircle className="h-6 w-6 text-muted opacity-40" />
      <p className="text-xs text-muted max-w-[240px] leading-relaxed">{message}</p>
    </div>
  );
}

export default function DriftPage() {
  return (
    <>
      <Topbar title="Drift Prediction" subtitle="Answers: Where did it come from? Where will it go? — OpenDrift Lagrangian model" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card
            title="Backward & Forward Trajectory"
            subtitle="Wind + surface current forced Lagrangian particle tracking"
            icon={Waves}
            className="lg:col-span-2"
          >
            <MapView
              height={440}
              showSlick
              showBackwardDrift
              showForwardDrift
              showCoastalAssets
            />
            <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Detected slick</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-warning" /> Backward hindcast (origin)</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-accent" /> Forward forecast</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Coastal asset at risk</span>
            </div>
          </Card>

          <div className="space-y-5">
            <Card title="Origin Estimate" subtitle="Where did it come from?" icon={History}>
              <EmptyBox message="Backward drift computation runs after a scene is processed. Upload a SAR scene on the Detection page to populate this panel." />
            </Card>

            <Card title="Forecast" subtitle="Where will it go?" icon={TrendingUp}>
              <EmptyBox message="Forward drift forecast is available after a confirmed spill detection is processed through the pipeline." />
            </Card>
          </div>
        </div>

        <Card title="At-Risk Coastal Assets" subtitle="Sensitive zones along the forward drift cone" icon={MapPinned}>
          <EmptyBox message="Coastal assets at risk will populate here once a forward drift forecast is computed for an active spill detection." />
        </Card>
      </main>
    </>
  );
}
