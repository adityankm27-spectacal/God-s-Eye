import Link from "next/link";
import Image from "next/image";
import {
  Satellite,
  Ship,
  Waves,
  ArrowRight,
  Radar,
  FlaskConical,
  FileWarning,
  ChevronRight,
} from "lucide-react";

/* ── Nav links (unchanged from original) ────────────────── */
const navLinks = [
  { label: "Detection", href: "/dashboard/detection" },
  { label: "Drift", href: "/dashboard/drift" },
  { label: "Vessels", href: "/dashboard/vessels" },
  { label: "Approach", href: "/dashboard/tech" },
];

/* ── Feature cards — real capabilities only ─────────────── */
const features = [
  {
    icon: Satellite,
    title: "Spill Detection",
    desc: "SAR + EO Imagery, AI Segmentation, and Look Alike Filtering to confirm real slicks.",
    href: "/dashboard/detection",
  },
  {
    icon: Waves,
    title: "Drift & Origin",
    desc: "Backward hindcasting and forward forecasting with wind, current, tide and wave data.",
    href: "/dashboard/drift",
  },
  {
    icon: Ship,
    title: "Vessel Attribution",
    desc: "AIS correlation and explainable ranking to identify the most likely responsible vessel.",
    href: "/dashboard/vessels",
  },
  {
    icon: FlaskConical,
    title: "Oil Characterization",
    desc: "Oil type classification and volume estimation from spectral and radar signatures.",
    href: "/dashboard/characterization",
  },
  {
    icon: FileWarning,
    title: "Evidence & Alerts",
    desc: "Evidence Reports compilation and one click alerting to the nearest maritime authorities.",
    href: "/dashboard/evidence",
  },
  {
    icon: Radar,
    title: "Live Dashboard",
    desc: "Unified situational map with spill extent, drift forecast, and vessel positions.",
    href: "/dashboard",
  },
];

/* ── Pipeline steps — the real analysis chain ───────────── */
const pipeline = [
  { n: "01", label: "Input SAR image" },
  { n: "02", label: "Slick Detection" },
  { n: "03", label: "Characterize Oil" },
  { n: "04", label: "Trace Back to Origin" },
  { n: "05", label: "Attribute Vessels" },
  { n: "06", label: "Alert Authorities" },
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-surface h-20"
        style={{ borderColor: "var(--border)" }}
        data-id="main-nav"
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 md:px-10">

          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="God's Eye home">
            <Image
              src="/brand/logo-icon-64.png"
              alt="God's Eye"
              width={1254}
              height={1254}
              className="h-24 w-24 translate-y-2"
              priority
            />
            {/* <span className="font-display text-[17px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              God&apos;s Eye
            </span> */}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
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

          {/* CTA */}
          <Link
            href="/dashboard"
            className="btn-ocean shrink-0 text-sm"
            data-id="nav-cta"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative isolate flex min-h-screen flex-col overflow-hidden"
        aria-label="Hero"
      >
        {/* The photo sits in a right-hand panel: the feathered left edge carries
            the ocean into the background instead of ending on a hard seam. */}
        <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[62%] lg:w-[58%]">
          {/* Change this image path to use a different hero image. */}
          <Image
            src="/hero/vessel.jpg"
            alt="Margitime vessel under satellite surveillance"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 62vw"
            className="object-cover object-center"
          />
          {/* Gradient feathers the photo into the page background on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/45 via-25% to-transparent" />
        </div>

        {/* Top + bottom fade keeps the nav and feature grid from hard-edging */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-transparent to-background" />

        {/* Mobile scrim — photo goes full-bleed below md, headline needs contrast */}
        <div className="absolute inset-0 -z-10 bg-background/55 md:hidden" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-16 pt-20 md:px-10 md:pb-24 md:pt-32">
          <div className="max-w-2xl">

            {/* Badge */}
            <div
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--muted)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "var(--accent-2)" }}
                aria-hidden="true"
              />
              Smart India Hackathon 2026 · PS ID SIH26143 · Team BlueVision
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up animate-fade-up-2 font-display mt-7 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ color: "var(--foreground)" }}
            >
              See Beyond<br />the Surface.
            </h1>

            {/* CTAs */}
            <div className="animate-fade-up animate-fade-up-3 mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="btn-ocean"
                data-id="hero-primary-cta"
              >
                Explore Dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard/detection"
                className="btn-ocean-ghost"
                data-id="hero-secondary-cta"
              >
                View Detection
              </Link>
            </div>

            {/* Sentinel chips */}
            <div
              className="animate-fade-up animate-fade-up-4 mt-10 flex flex-wrap items-center gap-2.5 text-xs"
              style={{ color: "var(--muted)" }}
            >
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1">
                <Satellite className="h-3 w-3" aria-hidden="true" /> EOS-04 Satellite
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1">
                <Ship className="h-3 w-3" aria-hidden="true" /> Live AIS
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1">
                <Waves className="h-3 w-3" aria-hidden="true" /> Drift Models
              </span>
            </div>

            {/* Supporting copy — lower in the column to mirror original layout */}
            <p
              className="animate-fade-up animate-fade-up-4 mt-14 max-w-md text-sm leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              Detecting oil spills from space, tracing them back to their origin,
              and ranking the suspected vessels, so we can alert the
              Indian Coast Guard first.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PIPELINE STRIP
      ═══════════════════════════════════════════════════ */}
      <section
        className="relative z-10 mx-auto max-w-5xl px-6 md:px-10"
        style={{ marginTop: "-2rem" }}
        aria-label="Analysis pipeline"
      >
        <div
          className="overflow-x-auto rounded-2xl border px-6 py-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex min-w-max items-center gap-1">
            {pipeline.map((step, i) => (
              <div key={step.n} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5 px-2 text-center w-[92px]">
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: "var(--aqua)" }}
                  >
                    {step.n}
                  </span>
                  <span className="text-[11px] font-medium leading-snug" style={{ color: "var(--foreground)" }}>
                    {step.label}
                  </span>
                </div>
                {i < pipeline.length - 1 && (
                  <ChevronRight
                    className="mx-1 h-4 w-4 shrink-0"
                    style={{ color: "var(--border)" }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CAPABILITIES SECTION
      ═══════════════════════════════════════════════════ */}
      <section
        className="mx-auto max-w-7xl px-6 pb-8 pt-20 md:px-10"
        aria-labelledby="capabilities-heading"
      >
        <div className="mb-12 text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Platform Capabilities
          </p>
          <h2
            id="capabilities-heading"
            className="font-display text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--foreground)" }}
          >
            Everything you need to respond.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            From raw satellite imagery to completely analyzed reports ; God&apos;s Eye handles the complete
            oil spill response pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group ocean-card flex flex-col gap-4 p-6 no-underline"
              data-id={`feature-card-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {/* Icon ring */}
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-250 group-hover:bg-[var(--aqua)]"
                style={{
                  background: "rgba(40,184,216,0.12)",
                }}
              >
                <f.icon
                  className="h-5 w-5 transition-colors duration-250 group-hover:text-white"
                  style={{ color: "var(--accent-2)" }}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {f.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {f.desc}
                </p>
              </div>

              <div
                className="mt-auto flex items-center gap-1 text-xs font-medium transition-colors duration-200 group-hover:gap-2"
                style={{ color: "var(--accent-2)" }}
              >
                Explore
                <ArrowRight className="h-3.5 w-3.5 transition-all duration-200" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════ */}
      <section
        className="mx-auto max-w-7xl px-6 py-16 pb-24 md:px-10"
        aria-label="Call to action"
      >
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16"
          style={{
            background: "var(--deep-ocean)",
            boxShadow: "var(--shadow-hover)",
          }}
        >
          {/* Decorative radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(8,126,164,0.20) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <p
            className="relative font-display text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: "var(--ocean-white)" }}
          >
            Ready to monitor the ocean?
          </p>
          <p
            className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed"
            style={{ color: "var(--nav-text)" }}
          >
            Open the mission dashboard to view live spill data, vessel tracking,
            drift forecasts and the full analysis pipeline.
          </p>
          <Link
            href="/dashboard"
            className="btn-ocean relative mt-8 inline-flex"
            data-id="banner-cta"
          >
            Open Mission Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer
        className="border-t px-6 py-8 md:px-10"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        aria-label="Site footer"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs sm:flex-row"
          style={{ color: "var(--muted)" }}
        >
          <div className="flex items-center gap-2">
            <Image
              src="/brand/logo-icon-64.png"
              alt="God's Eye"
              width={1254}
              height={1254}
              className="h-16 w-16"
            />
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              God&apos;s Eye
            </span>
            <span>· Team BlueVision · SIH 2026</span>
          </div>
          <nav className="flex items-center gap-5" aria-label="Footer navigation">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-foreground"
                style={{ color: "var(--muted)" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

    </main>
  );
}
