import Link from "next/link";
import Image from "next/image";
import { Satellite, Ship, Waves, ArrowRight, Radar } from "lucide-react";

const navLinks = [
  { label: "Detection", href: "/dashboard/detection" },
  { label: "Drift", href: "/dashboard/drift" },
  { label: "Vessels", href: "/dashboard/vessels" },
  { label: "Approach", href: "/dashboard/tech" },
];

// Small icon chips standing in for the reference layout's "trusted by" avatar
// cluster — the overlap + ring reads as one group rather than three buttons.
const capabilityChips = [Satellite, Waves, Ship];

const features = [
  { icon: Satellite, title: "Satellite-based Spill Detection", desc: "SAR + EO imagery, AI segmentation, and look-alike filtering to confirm real slicks." },
  { icon: Waves, title: "Drift & Origin Modelling", desc: "Backward hindcasting and forward forecasting with wind, current and wave data." },
  { icon: Ship, title: "Vessel Attribution", desc: "AIS correlation and explainable ranking to identify the most likely responsible vessel." },
  { icon: Radar, title: "Live Response Dashboard", desc: "Evidence compilation and one-click alerting to the nearest maritime authorities." },
];

export default function Home() {
  return (
    <main className="relative flex-1">
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
        {/* The photo sits in a right-hand panel rather than full-bleed: the source
            crop is nearly square, so stretching it edge-to-edge across a 16:9
            hero would zoom it ~3x. A panel roughly its own aspect ratio keeps the
            vessel at natural scale, and the feathered left edge carries the ocean
            into the flat background instead of ending on a seam. */}
        <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[62%] lg:w-[58%]">
          <Image
            src="/hero/vessel.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 62vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/45 via-25% to-transparent" />
        </div>
        {/* Lands the hero on the flat page background top and bottom, so the nav
            reads cleanly and the feature grid doesn't start on a hard edge. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-transparent to-background" />
        {/* Below md the photo goes full-bleed and the headline crosses the lit
            containers, so it needs a flat scrim the side-panel gradient can't
            provide. Drops away once the photo is confined to its own column. */}
        <div className="absolute inset-0 -z-10 bg-background/55 md:hidden" />

        <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/brand/logo-icon-64.png"
              alt="God's Eye"
              width={64}
              height={64}
              className="h-7 w-7"
            />
            <span className="font-display text-lg font-semibold tracking-tight">God&apos;s Eye</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/dashboard"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open Dashboard
          </Link>
        </header>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between px-6 pb-12 pt-16 md:px-10 md:pb-16 md:pt-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-xs text-muted backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2 animate-pulse" />
              Smart India Hackathon 2026 · PS ID SIH26143 · Team BlueVision
            </div>

            <h1 className="font-display mt-7 text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
              <span className="block font-normal">The ocean is vast.</span>
              <span className="block font-bold">Nothing escapes.</span>
            </h1>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Enter Mission Dashboard <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {capabilityChips.map((Icon, i) => (
                    <span
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-surface-2"
                    >
                      <Icon className="h-3.5 w-3.5 text-accent" />
                    </span>
                  ))}
                </div>
                <p className="max-w-[9rem] text-xs leading-snug text-muted">
                  Sentinel-1 SAR · AIS · drift models
                </p>
              </div>
            </div>
          </div>

          <p className="mt-16 max-w-md text-sm leading-relaxed text-muted">
            Detecting oil spills from space, tracing them back to their origin, and ranking the vessels
            responsible — so responders reach the right place, with the right evidence, first.
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-accent/40">
              <f.icon className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold">{f.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface p-5">
          <p className="text-center text-xs text-muted">
            Satellite Images → Is there a spill? → How big? → What kind of oil? → Where did it come from? → Where will it go?
            → Which ships were nearby? → Which is most suspicious? → Report to authorities → Dashboard
          </p>
        </div>
      </div>
    </main>
  );
}
