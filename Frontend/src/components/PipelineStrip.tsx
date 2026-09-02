import { pipeline } from "@/lib/mockData";
import { Check, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function PipelineStrip() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 overflow-x-auto">
      <div className="flex items-center min-w-max gap-1">
        {pipeline.map((stage, i) => (
          <div key={stage.id} className="flex items-center">
            <div className="flex flex-col items-center w-[104px] text-center">
              <div
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  stage.status === "done" && "bg-accent-2/15 border-accent-2 text-accent-2",
                  stage.status === "active" && "bg-accent/15 border-accent text-accent",
                  stage.status === "pending" && "bg-surface-2 border-border text-muted"
                )}
              >
                {stage.status === "done" ? (
                  <Check className="h-4 w-4" />
                ) : stage.status === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              <p className="mt-1.5 text-[11px] font-medium leading-tight">{stage.label}</p>
              <p className="text-[10px] text-muted leading-tight">{stage.question}</p>
              {stage.timestamp && <p className="text-[9px] text-accent-2 font-mono mt-0.5">{stage.timestamp}</p>}
            </div>
            {i < pipeline.length - 1 && (
              <div
                className={clsx(
                  "h-0.5 w-6 shrink-0",
                  stage.status === "done" ? "bg-accent-2" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
