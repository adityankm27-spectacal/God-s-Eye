import clsx from "clsx";
import { LucideIcon } from "lucide-react";

export function Card({
  children,
  className,
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className={clsx("rounded-xl border border-border bg-surface", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-4 w-4 text-accent shrink-0" />}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{title}</h3>
              {subtitle && <p className="text-[11px] text-muted truncate">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendTone = "positive",
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  /** "muted" for caveats/assumptions, which must not read as a good-news
   *  trend the way the default green does. */
  trendTone?: "positive" | "muted";
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-muted">{label}</p>
        <Icon
          className={clsx(
            "h-4 w-4",
            tone === "danger" ? "text-danger" : tone === "success" ? "text-accent-2" : "text-accent"
          )}
        />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
        {unit && <span className="text-sm text-muted font-normal ml-1">{unit}</span>}
      </p>
      {trend && (
        <p className={clsx("mt-1 text-[11px]", trendTone === "muted" ? "text-muted" : "text-accent-2")}>
          {trend}
        </p>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger" | "success" | "warning" | "info";
}) {
  const toneClasses = {
    default: "bg-surface-2 text-muted border-border",
    danger: "bg-danger/10 text-danger border-danger/30",
    success: "bg-accent-2/10 text-accent-2 border-accent-2/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    info: "bg-accent/10 text-accent border-accent/30",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "danger" | "warning" }) {
  const color = tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-accent";
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
      <div className={clsx("h-full rounded-full", color)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
