"use client";

import { Bell, Search, ChevronDown } from "lucide-react";

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/60 px-4 md:px-6 backdrop-blur">
      <div className="min-w-0">
        <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted w-64">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search vessel, spill ID…</span>
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 pl-1 pr-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-orange to-accent text-[11px] font-bold text-background">
            OA
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-medium">Ops Analyst</p>
            <p className="text-[10px] text-muted">Coast Guard Liaison</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted hidden md:block" />
        </div>
      </div>
    </header>
  );
}
