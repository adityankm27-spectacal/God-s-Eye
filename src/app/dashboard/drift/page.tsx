import Topbar from "@/components/Topbar";
import MapView from "@/components/MapView";
import { Card, Stat, Badge } from "@/components/ui";
import { coastalAssets } from "@/lib/mockData";
import { Waves, History, TrendingUp, MapPinned } from "lucide-react";

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
              <div className="space-y-2.5">
                <Stat label="Estimated origin point" value="71.50°E, 19.65°N" />
                <Stat label="Estimated release time" value="24 Aug 2026, ~22:40 UTC" />
                <Stat label="Backtrack duration" value="5.5 hours" />
                <Stat label="Hindcast confidence" value="82%" />
              </div>
            </Card>

            <Card title="Forecast" subtitle="Where will it go?" icon={TrendingUp}>
              <div className="space-y-2.5">
                <Stat label="Forecast horizon" value="48 hours" />
                <Stat label="Direction of travel" value="SE, toward Konkan coast" />
                <Stat label="Nearest landfall ETA" value="~26 hours" />
                <Stat label="Forecast confidence" value="74% (decays with time)" />
              </div>
            </Card>
          </div>
        </div>

        <Card title="At-Risk Coastal Assets" subtitle="Sensitive zones along the forward drift cone" icon={MapPinned}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coastalAssets.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{a.name}</p>
                  <Badge tone={a.sensitivity === "High" ? "danger" : "warning"}>{a.sensitivity}</Badge>
                </div>
                <p className="text-xs text-muted mt-1">{a.type}</p>
                <p className="text-xs text-accent-2 mt-2">ETA: {a.etaHours}h</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </>
  );
}
