"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/components/Topbar";
import VesselAttributionView from "@/components/VesselAttributionView";
import { Card } from "@/components/ui";
import { Ship, AlertCircle } from "lucide-react";

function NoJobPlaceholder() {
  return (
    <Card title="Vessel Attribution" subtitle="SAR + AIS correlation and suspicion ranking" icon={Ship}>
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-2/40 px-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-muted opacity-40" />
        <div>
          <p className="text-sm font-medium text-muted">No vessel analysis loaded</p>
          <p className="text-xs text-muted/70 mt-1 max-w-[320px] leading-relaxed">
            To see vessel attribution results here, upload a SAR scene on the{" "}
            <span className="text-accent">Spill Detection</span> page, enable the
            {" "}"Attribute vessel (live AIS)" option, and wait for the job to complete.
            This page will then be linked directly from the detection results.
          </p>
        </div>
      </div>
    </Card>
  );
}

function VesselsContent() {
  const jobId = useSearchParams().get("job") ?? undefined;
  return jobId ? <VesselAttributionView initialJobId={jobId} /> : <NoJobPlaceholder />;
}

export default function VesselsPage() {
  return (
    <>
      <Topbar title="Vessel Attribution" subtitle="Answers: Which ships were nearby? Which is most suspicious? — SAR + AIS correlation" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <Suspense fallback={null}>
          <VesselsContent />
        </Suspense>
      </main>
    </>
  );
}
