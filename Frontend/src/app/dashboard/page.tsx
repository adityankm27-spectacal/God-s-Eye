import Topbar from "@/components/Topbar";
import PipelineStrip from "@/components/PipelineStrip";
import MapView from "@/components/MapView";
import { Card, KpiCard } from "@/components/ui";
import { Droplets, Ship, Radar, BellRing, AlertCircle } from "lucide-react";

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border bg-surface-2/40 px-4 py-8 text-center">
      <AlertCircle className="h-7 w-7 text-muted opacity-40" />
      <p className="text-xs text-muted max-w-[240px] leading-relaxed">{message}</p>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <>
      <Topbar title="Mission Overview" subtitle="Western Arabian Sea · Indian Coast Guard AOR" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <PipelineStrip />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Spills" value="—" icon={Droplets} tone="danger" trend="No live data yet" />
          <KpiCard label="Vessels Tracked" value="—" icon={Ship} trend="Awaiting AIS feed" />
          <KpiCard label="Area Monitored" value="—" unit="km²" icon={Radar} />
          <KpiCard label="Alerts Sent (24h)" value="—" icon={BellRing} trend="No alerts dispatched" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card
            title="Live Situational Map"
            subtitle="Spill extent · drift forecast · vessel positions · coastal assets"
            icon={Radar}
            className="xl:col-span-2"
          >
            <MapView
              height={440}
              showSlick
              showBackwardDrift
              showForwardDrift
              showVessels
              showCoastalAssets
            />
            <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Slick extent</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Backward drift</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Forward forecast</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-2" /> Low-risk vessel</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> High-risk vessel</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Coastal asset</span>
            </div>
          </Card>

          <div className="space-y-5">
            <Card title="Active Incident" subtitle="Most recent processed spill" icon={Droplets}>
              <EmptyCard message="No active incident loaded. Process a SAR scene on the Spill Detection page to populate this panel." />
            </Card>

            <Card title="Top Suspect Vessel" subtitle="Highest attribution score" icon={Ship}>
              <EmptyCard message="No vessel analysis available. Enable vessel attribution when uploading a scene to see results here." />
            </Card>
          </div>
        </div>

        <Card title="Spill Trend — Last 6 Months" subtitle="Detected incidents & cumulative slick area across monitored AOR" icon={Radar}>
          <EmptyCard message="Historical trend chart will populate as scenes are processed through the pipeline." />
        </Card>
      </main>
    </>
  );
}
