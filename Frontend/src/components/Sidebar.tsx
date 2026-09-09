"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Satellite,
  Ruler,
  FlaskConical,
  Waves,
  Ship,
  FileWarning,
  Settings2,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/detection", label: "Spill Detection", icon: Satellite },
  { href: "/dashboard/characterization", label: "Characterization", icon: Ruler },
  { href: "/dashboard/oiltype", label: "Oil Type ID", icon: FlaskConical },
  { href: "/dashboard/drift", label: "Drift Prediction", icon: Waves },
  { href: "/dashboard/vessels", label: "Vessel Attribution", icon: Ship },
  { href: "/dashboard/evidence", label: "Evidence & Alerts", icon: FileWarning },
  { href: "/dashboard/tech", label: "Tech Stack", icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <Image
          src="/brand/logo.png"
          alt="God's Eye"
          width={816}
          height={816}
          className="h-12 w-12 shrink-0 -translate-y-2"
          priority
        />
        <div>
          {/* <p className="font-display text-[15px] font-bold leading-none tracking-tight">God&apos;s Eye</p> */}
          <Image
            src="/brand/logo-name.png"
            alt="God's Eye"
            width={1254}
            height={237}
            className="h-8 w-40 shrink-0"
            priority
          />
          <p className="text-[10px] text-muted mt-1 tracking-wide">TEAM BLUEVISION · SIH 2026</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-muted hover:text-foreground hover:bg-surface-2 border border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="rounded-lg bg-surface-2 border border-border p-3">
          <p className="text-[11px] text-muted leading-relaxed">
            PS ID <span className="text-foreground font-mono">SIH26143</span>
            <br />
            Theme: Disaster Management
          </p>
        </div>
      </div>
    </aside>
  );
}
