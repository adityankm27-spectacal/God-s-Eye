"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { Card, Stat } from "@/components/ui";
import { FileWarning, Send, Download, CheckCircle2, Wrench, ShieldCheck, AlertCircle } from "lucide-react";

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border bg-surface-2/40 px-4 py-6 text-center">
      <AlertCircle className="h-6 w-6 text-muted opacity-40" />
      <p className="text-xs text-muted max-w-[260px] leading-relaxed">{message}</p>
    </div>
  );
}

const AUTHORITIES = [
  { name: "MRCC Mumbai", role: "Primary — coastal jurisdiction", checked: true },
  { name: "Coast Guard District HQ-3", role: "Secondary jurisdiction", checked: true },
  { name: "DG Shipping Regional Office", role: "Regulatory / compliance", checked: false },
  { name: "Konkan Coastal Marine Police", role: "Landfall zone advisory", checked: false },
];

export default function EvidencePage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <Topbar title="Evidence & Alerts" subtitle="Compiled report, court-ready evidence, and authority dispatch" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="Evidence File" subtitle="Auto-compiled report · awaiting job" icon={FileWarning} className="lg:col-span-2">
            <div className="space-y-4 text-sm">
              <EmptyBox message="No evidence file yet. Process a SAR scene on the Spill Detection page and complete the full pipeline to auto-compile this report." />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 opacity-50 pointer-events-none select-none">
                <Stat label="Incident ID" value="—" />
                <Stat label="Detected" value="—" />
                <Stat label="Satellite Pass" value="—" />
                <Stat label="Slick Area" value="—" />
                <Stat label="Volume Est." value="—" />
                <Stat label="Oil Type" value="—" />
              </div>

              <div className="rounded-lg border border-border/40 bg-surface-2/40 p-3">
                <p className="text-xs text-muted mb-1">Primary Suspect</p>
                <p className="text-xs text-muted/60 italic">No vessel attributed yet. Enable vessel attribution when uploading a scene.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted opacity-50">
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> SAR raw scene + AI segmentation mask</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> Backward drift reconstruction</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> AIS track history (72h)</p>
                <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-2" /> Explainability report (SHAP)</p>
              </div>

              <button
                disabled
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs font-medium opacity-50 cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" /> Export Evidence Report (PDF)
              </button>
            </div>
          </Card>

          <Card title="Alert Nearest Authorities" subtitle="Dispatch to Indian Coast Guard MRCC" icon={Send}>
            <div className="space-y-3">
              {AUTHORITIES.map((a) => (
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
                  <><CheckCircle2 className="h-4 w-4" /> Alert Dispatched</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Alert Now</>
                )}
              </button>
              {sent && <p className="text-[10px] text-accent-2 text-center">Alert sent · awaiting confirmation reference</p>}
            </div>
          </Card>
        </div>

        <Card title="Recommended Response" subtitle="Cleanup method selection based on spill & sea-state characteristics" icon={Wrench}>
          <EmptyBox message="Response recommendation appears after oil type classification and drift forecast are completed for the active spill." />
        </Card>
      </main>
    </>
  );
}
