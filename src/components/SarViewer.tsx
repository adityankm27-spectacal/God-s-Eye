"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";

// Deterministic pseudo-random so server/client render identically after mount-only draw
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const blobPoints = [
  [0.42, 0.38],
  [0.5, 0.34],
  [0.58, 0.37],
  [0.63, 0.44],
  [0.6, 0.52],
  [0.62, 0.6],
  [0.55, 0.66],
  [0.46, 0.64],
  [0.4, 0.58],
  [0.36, 0.5],
  [0.38, 0.43],
];

function drawSar(canvas: HTMLCanvasElement, mode: "raw" | "mask" | "split") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const rand = mulberry32(42);

  // Ocean speckle base
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const speckle = 28 + rand() * 34;
    img.data[i] = speckle * 0.55;
    img.data[i + 1] = speckle * 0.62;
    img.data[i + 2] = speckle * 0.72;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // Faint horizontal SAR banding
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(0, y, w, 1);
  }
  ctx.globalAlpha = 1;

  const drawBlob = (fill: string, alpha: number) => {
    ctx.beginPath();
    blobPoints.forEach(([px, py], i) => {
      const x = px * w;
      const y = py * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  if (mode === "raw" || mode === "split") {
    const clipW = mode === "split" ? w / 2 : w;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, clipW, h);
    ctx.clip();
    // dark dampened patch = oil slick signature in raw SAR (low backscatter)
    drawBlob("#050708", 0.85);
    ctx.restore();
  }

  if (mode === "mask" || mode === "split") {
    const startX = mode === "split" ? w / 2 : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, 0, w - startX, h);
    ctx.clip();
    drawBlob("#050708", 0.85);
    drawBlob("#f87171", 0.38);
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 2;
    ctx.beginPath();
    blobPoints.forEach(([px, py], i) => {
      const x = px * w;
      const y = py * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  if (mode === "split") {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  }
}

export default function SarViewer({ height = 380 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"raw" | "mask" | "split">("split");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 500;
    drawSar(canvas, mode);
  }, [mode]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
      <canvas ref={canvasRef} className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scan-line absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-accent/10 to-transparent" />
      </div>

      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-background/70 backdrop-blur px-2 py-1 text-[10px] font-mono text-accent-2 border border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-2 animate-pulse" />
        SENTINEL-1A · VV/VH · 25.08.2026 04:12 UTC
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex gap-1 rounded-md bg-background/70 backdrop-blur p-1 border border-border">
          {(["raw", "split", "mask"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {m === "raw" ? "Raw SAR" : m === "split" ? "Compare" : "AI Mask"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-md bg-background/70 backdrop-blur px-2 py-1 text-[10px] text-muted border border-border">
          <Layers className="h-3 w-3" />
          U-Net segmentation · 94.2% conf.
        </div>
      </div>
    </div>
  );
}
