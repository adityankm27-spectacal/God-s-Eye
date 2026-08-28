"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { Card, Badge, Stat } from "@/components/ui";
import { activeSpill, vessels, cleanupRecommendation } from "@/lib/mockData";
import { FileWarning, Send, Download, CheckCircle2, Wrench, ShieldCheck } from "lucide-react";

export default function EvidencePage() {
  const [sent, setSent] = useState(false);
  const topVessel = [...vessels].sort((a, b) => b.suspicionScore - a.suspicionScore)[0];

  return (
    <>
      <Topbar title="Evidence & Alerts" subtitle="Compiled report, court-ready evidence, and authority dispatch" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="Evidence File" subtitle={`Auto-compiled report · ${activeSpill.id}`} icon={FileWarning} className="lg:col-span-2">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Incident ID" value={activeSpill.id} />
                <Stat label="Detected" value="25 Aug 2026, 04:12 UTC" />
                <Stat label="Satellite Pass" value={activeSpill.satellite} />
                <Stat label="Slick Area" value={`${activeSpill.areaKm2} km²`} />
                <Stat label="Volume Est." value={`${activeSpill.volumeBarrels.toLocaleString()} bbl`} />
                <Stat label="Oil Type" value={activeSpill.oilType} />
              </div>

              <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
                <p className="text-xs text-muted mb-1">Primary Suspect</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{topVessel.name} <span className="text-muted font-normal">({topVessel.mmsi})</span></p>
                    <p className="text-xs text-muted">Reverse-drift path intersects vessel course; {topVessel.aisGapMin}min AIS gap during release window.</p>
                  </div>
                  <Badge tone="danger">{topVessel.suspicionScore}% confidence</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> SAR raw scene + AI segmentation mask attached</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> Backward drift reconstruction attached</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> AIS track history (72h) attached</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> Explainability report (SHAP) attached</p>
              </div>

              <button className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs font-medium hover:border-accent hover:text-accent transition-colors">
                <Download className="h-3.5 w-3.5" /> Export Evidence Report (PDF)
              </button>
            </div>
          </Card>

          <Card title="Alert Nearest Authorities" subtitle="Dispatch to Indian Coast Guard MRCC" icon={Send}>
            <div className="space-y-3">
              {[
                { name: "MRCC Mumbai", role: "Primary — 26km from slick", checked: true },
                { name: "Coast Guard District HQ-3", role: "Secondary jurisdiction", checked: true },
                { name: "DG Shipping Regional Office", role: "Regulatory / compliance", checked: false },
                { name: "Konkan Coastal Marine Police", role: "Landfall zone advisory", checked: false },
              ].map((a) => (
                <label key={a.name} className="flex items-start gap-2.5 rounded-lg bg-surface-2 p-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked={a.checked} className="mt-0.5 accent-cyan-400" />
                  <div>
                    <p className="text-xs font-medium">{a.name}</p>
                    <p className="text-[10px] text-muted">{a.role}</p>
                  </div>
                </label>
              ))}

              <button
                onClick={() => setSent(true)}
                disabled={sent}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-background hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {sent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Alert Dispatched
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Alert Now
                  </>
                )}
              </button>
              {sent && <p className="text-[10px] text-accent-2 text-center">Sent 25 Aug 2026, 04:19 UTC · Ref# ALT-7734</p>}
            </div>
          </Card>
        </div>

        <Card title="Recommended Response" subtitle="Cleanup method selection based on spill & sea-state characteristics" icon={Wrench}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-accent-2" />
                <p className="text-sm font-semibold">{cleanupRecommendation.method}</p>
              </div>
              <p className="text-xs text-muted leading-relaxed">{cleanupRecommendation.reasoning}</p>
            </div>
            <div>
              <p className="text-xs font-medium mb-2">Resources Recommended</p>
              <ul className="space-y-1.5 text-xs text-muted">
                {cleanupRecommendation.resourcesRecommended.map((r) => (
                  <li key={r} className="flex items-start gap-1.5">
                    <span className="text-accent-2 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
