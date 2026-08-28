import Topbar from "@/components/Topbar";
import PipelineStrip from "@/components/PipelineStrip";
import MapView from "@/components/MapView";
import Chart from "@/components/Chart";
import { Card, KpiCard, Badge } from "@/components/ui";
import { activeSpill, kpis, historicalSpills, vessels } from "@/lib/mockData";
import { Droplets, Ship, Radar, BellRing, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  const topVessel = [...vessels].sort((a, b) => b.suspicionScore - a.suspicionScore)[0];

  return (
    <>
      <Topbar title="Mission Overview" subtitle="Western Arabian Sea · Indian Coast Guard AOR" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <PipelineStrip />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Spills" value={kpis.activeSpills} icon={Droplets} tone="danger" trend="+1 since yesterday" />
          <KpiCard label="Vessels Tracked" value={kpis.vesselsTracked} icon={Ship} trend="Live AIS feed" />
          <KpiCard label="Area Monitored" value={kpis.areaMonitoredKm2.toLocaleString()} unit="km²" icon={Radar} />
          <KpiCard label="Alerts Sent (24h)" value={kpis.alertsSent24h} icon={BellRing} tone="success" trend="Avg. response 22 min" />
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
            <Card title="Active Incident" subtitle={activeSpill.id} icon={Droplets}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activeSpill.name}</p>
                  <Badge tone="danger">ACTIVE</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-surface-2 p-2">
                    <p className="text-muted">Area</p>
                    <p className="font-medium">{activeSpill.areaKm2} km²</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <p className="text-muted">Confidence</p>
                    <p className="font-medium">{activeSpill.confidence}%</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <p className="text-muted">Volume</p>
                    <p className="font-medium">{activeSpill.volumeBarrels.toLocaleString()} bbl</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <p className="text-muted">Oil Type</p>
                    <p className="font-medium">Medium Crude</p>
                  </div>
                </div>
                <Link href="/dashboard/detection" className="flex items-center gap-1 text-xs text-accent hover:underline pt-1">
                  View detection details <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>

            <Card title="Top Suspect Vessel" subtitle="Highest attribution score" icon={Ship}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{topVessel.name}</p>
                  <p className="text-xs text-muted">{topVessel.type} · {topVessel.flag}</p>
                </div>
                <Badge tone="danger">{topVessel.suspicionScore}% risk</Badge>
              </div>
              <Link href="/dashboard/vessels" className="flex items-center gap-1 text-xs text-accent hover:underline pt-2">
                View full ranking <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Card>
          </div>
        </div>

        <Card title="Spill Trend — Last 6 Months" subtitle="Detected incidents & cumulative slick area across monitored AOR" icon={Radar}>
          <Chart
            data={[
              {
                x: historicalSpills.map((d) => d.month),
                y: historicalSpills.map((d) => d.count),
                type: "bar",
                name: "Incidents",
                marker: { color: "#22d3ee" },
              },
              {
                x: historicalSpills.map((d) => d.month),
                y: historicalSpills.map((d) => d.areaKm2),
                type: "scatter",
                mode: "lines+markers",
                name: "Total Area (km²)",
                yaxis: "y2",
                line: { color: "#fb923c" },
              },
            ]}
            layout={{
              yaxis2: { overlaying: "y", side: "right", gridcolor: "transparent" },
            }}
          />
        </Card>
      </main>
    </>
  );
}
