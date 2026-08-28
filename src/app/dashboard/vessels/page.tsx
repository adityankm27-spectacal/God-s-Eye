"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import MapView from "@/components/MapView";
import { Card, Badge, ProgressBar } from "@/components/ui";
import SarThumbCard from "@/components/SarThumbCard";
import { vessels } from "@/lib/mockData";
import { Ship, ShieldAlert, Radar } from "lucide-react";
import clsx from "clsx";

export default function VesselsPage() {
  const sorted = [...vessels].sort((a, b) => b.suspicionScore - a.suspicionScore);
  const [selectedId, setSelectedId] = useState(sorted[0].id);
  const selected = sorted.find((v) => v.id === selectedId)!;

  const badgeTone = (score: number): "danger" | "warning" | "success" =>
    score > 70 ? "danger" : score > 40 ? "warning" : "success";
  const barTone = (score: number): "danger" | "warning" | "accent" =>
    score > 70 ? "danger" : score > 40 ? "warning" : "accent";

  return (
    <>
      <Topbar title="Vessel Attribution" subtitle="Answers: Which ships were nearby? Which is most suspicious? — SAR + AIS correlation" />
      <main className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title="AIS + SAR Correlation Map" subtitle="Vessel tracks overlaid on spill extent" icon={Radar} className="lg:col-span-2">
            <MapView
              height={420}
              showSlick
              showVessels
              showBackwardDrift
              highlightVesselId={selectedId}
            />
          </Card>

          <Card title="Suspect Ranking" subtitle={`${vessels.length} vessels within 20km at detection time`} icon={ShieldAlert}>
            <div className="space-y-2">
              {sorted.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={clsx(
                    "w-full text-left rounded-lg border p-2.5 transition-colors",
                    v.id === selectedId ? "border-accent bg-accent/5" : "border-border bg-surface-2 hover:border-muted"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold shrink-0">
                        #{v.rank}
                      </span>
                      <p className="text-xs font-medium truncate">{v.name}</p>
                    </div>
                    <Badge tone={badgeTone(v.suspicionScore)}>{v.suspicionScore}%</Badge>
                  </div>
                  <p className="text-[10px] text-muted mt-1 ml-7">{v.type} · {v.distanceKm}km away</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card title={`Explainability — ${selected.name}`} subtitle="SHAP-style feature contribution to suspicion score" icon={Ship} className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">MMSI</p><p className="font-medium mt-1 font-mono">{selected.mmsi}</p></div>
                <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Flag</p><p className="font-medium mt-1">{selected.flag}</p></div>
                <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Type</p><p className="font-medium mt-1">{selected.type}</p></div>
                <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Speed / Course</p><p className="font-medium mt-1">{selected.speedKt}kt / {selected.course}°</p></div>
                <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">AIS Gap</p><p className="font-medium mt-1">{selected.aisGapMin > 0 ? `${selected.aisGapMin} min` : "None"}</p></div>
                <div className="rounded-lg bg-surface-2 p-3"><p className="text-muted">Distance to slick</p><p className="font-medium mt-1">{selected.distanceKm} km</p></div>
              </div>

              <div className="space-y-2.5">
                {selected.factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{f.label}</span>
                      <span className="text-muted">+{Math.round(f.weight * 100)}</span>
                    </div>
                    <ProgressBar value={f.weight * 100 * 2.2} tone={barTone(selected.suspicionScore)} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <SarThumbCard />
        </div>
      </main>
    </>
  );
}
