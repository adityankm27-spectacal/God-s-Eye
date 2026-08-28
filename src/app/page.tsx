import Link from "next/link";
import { Eye, Satellite, Ship, Waves, ArrowRight, Radar } from "lucide-react";

const features = [
  { icon: Satellite, title: "Satellite-based Spill Detection", desc: "SAR + EO imagery, AI segmentation, and look-alike filtering to confirm real slicks." },
  { icon: Waves, title: "Drift & Origin Modelling", desc: "Backward hindcasting and forward forecasting with wind, current and wave data." },
  { icon: Ship, title: "Vessel Attribution", desc: "AIS correlation and explainable ranking to identify the most likely responsible vessel." },
  { icon: Radar, title: "Live Response Dashboard", desc: "Evidence compilation and one-click alerting to the nearest maritime authorities." },
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-2 animate-pulse" />
          Smart India Hackathon 2026 · PS ID SIH26143 · Team BlueVision
        </div>

        <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 shadow-[0_0_60px_rgba(34,211,238,0.35)]">
          <Eye className="h-10 w-10 text-background" strokeWidth={2.2} />
        </div>

        <h1 className="font-display mt-6 text-5xl md:text-6xl font-bold tracking-tight">God&apos;s Eye</h1>
        <p className="mt-4 max-w-2xl text-balance text-base md:text-lg text-muted">
          The ocean is too big to watch — so we make it smaller. Detecting oil spills from space, tracing them to
          their origin, and ranking the vessels responsible.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background hover:bg-accent/90 transition-colors"
          >
            Enter Mission Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/tech"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted hover:text-foreground hover:border-muted transition-colors"
          >
            View Technical Approach
          </Link>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-5 text-left hover:border-accent/40 transition-colors">
              <f.icon className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold">{f.title}</p>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-muted text-center">
            Satellite Images → Is there a spill? → How big? → What kind of oil? → Where did it come from? → Where will it go?
            → Which ships were nearby? → Which is most suspicious? → Report to authorities → Dashboard
          </p>
        </div>
      </div>
    </main>
  );
}
