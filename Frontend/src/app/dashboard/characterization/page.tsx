"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/components/Topbar";
import CharacterizationView from "@/components/CharacterizationView";

function CharacterizationContent() {
  const jobId = useSearchParams().get("job") ?? undefined;
  return <CharacterizationView initialJobId={jobId} />;
}

export default function CharacterizationPage() {
  return (
    <>
      <Topbar title="Slick Characterization" subtitle="Answer: How big is it? — Segmentation geometry & confidence" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <Suspense fallback={null}>
          <CharacterizationContent />
        </Suspense>
      </main>
    </>
  );
}
