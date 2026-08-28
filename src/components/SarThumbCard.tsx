import Link from "next/link";
import { Satellite, ArrowUpRight } from "lucide-react";
import { sarImageMeta, sarImages } from "@/lib/sarImage";

/**
 * "This is real" reference card: a genuine Sentinel-1 SAR detection
 * (MV Wakashio, Aug 2020), not an illustration. Dropped into pages that talk
 * about the detection method without showing the full scene viewer.
 */
export default function SarThumbCard({
  className,
  size = "compact",
}: {
  className?: string;
  /** "compact" for a sidebar slot, "large" for a standalone full-width row. */
  size?: "compact" | "large";
}) {
  const large = size === "large";
  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Satellite className="h-4 w-4 text-accent shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">Real SAR Reference</h3>
          <p className="text-[11px] text-muted truncate">
            {sarImageMeta.eventLabel} — the detection this dashboard is validated against
          </p>
        </div>
      </div>
      <Link href="/dashboard/detection" className="block relative group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={large ? sarImages.compare : sarImages.thumb}
          alt={`Sentinel-1 SAR detection over ${sarImageMeta.location}`}
          className={`w-full object-cover ${large ? "h-72 md:h-96" : "h-32"}`}
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-end p-2">
          <span className="flex items-center gap-1 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            View full detection <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
      <div className="px-4 py-2.5 text-[11px] text-muted">
        {sarImageMeta.platform} · {sarImageMeta.detectedAreaKm2} km² detected · real Sentinel-1 backscatter, not
        a rendering
      </div>
    </div>
  );
}
