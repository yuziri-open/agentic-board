import type { HTMLAttributes } from "react";
import { cn } from "./button";

const palettes: Record<string, string> = {
  active: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  archived: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  backlog: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  todo: "border-sky-400/30 bg-sky-400/12 text-sky-200",
  in_progress: "border-indigo-400/30 bg-indigo-400/12 text-indigo-200",
  in_review: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  done: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  cancelled: "border-rose-400/30 bg-rose-400/12 text-rose-200",
  idle: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  running: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  paused: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  error: "border-rose-400/30 bg-rose-400/12 text-rose-200"
};

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status?: string;
};

export function Badge({ children, className, status, ...props }: BadgeProps) {
  const resolvedStatus = status ?? "default";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize tracking-wide",
        palettes[resolvedStatus] ?? "border-white/10 bg-white/5 text-slate-200",
        className
      )}
      {...props}
    >
      {children ?? humanize(resolvedStatus)}
    </span>
  );
}
