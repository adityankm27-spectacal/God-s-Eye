"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { sarImageMeta, sarImages } from "@/lib/sarImage";

type Mode = "raw" | "compare" | "mask";

const MODE_LABEL: Record<Mode, string> = {
  raw: "Raw SAR",
  compare: "Compare",
  mask: "AI Mask",
};

const acquired = new Date(sarImageMeta.acquiredAt);
const acquiredLabel = `${acquired.toISOString().slice(0, 10).replace(/-/g, ".")} ${acquired
  .toISOString()
  .slice(11, 16)} UTC`;

export default function SarViewer({ height = 380 }: { height?: number }) {
  const [mode, setMode] = useState<Mode>("compare");

  return (
    <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sarImages[mode]}
        alt={`Sentinel-1 SAR scene over ${sarImageMeta.location}, ${MODE_LABEL[mode]} view`}
        className="h-full w-full object-cover"
      />

      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-background/70 backdrop-blur px-2 py-1 text-[10px] font-mono text-accent-2 border border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
        {sarImageMeta.platform.toUpperCase()} · {sarImageMeta.polarizations.join("/")} · {acquiredLabel}
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex gap-1 rounded-md bg-background/70 backdrop-blur p-1 border border-border">
          {(["raw", "compare", "mask"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-md bg-background/70 backdrop-blur px-2 py-1 text-[10px] text-muted border border-border">
          <Layers className="h-3 w-3" />
          Real CFAR detection · {sarImageMeta.detectedAreaKm2} km²
        </div>
      </div>
    </div>
  );
}
