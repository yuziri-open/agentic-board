import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "./button";

const palettes: Record<string, CSSProperties> = {
  active: createAccentBadge("var(--success)"),
  archived: createNeutralBadge(),
  backlog: createNeutralBadge(),
  todo: createAccentBadge("#0ea5e9"),
  in_progress: createAccentBadge("var(--accent)"),
  in_review: createAccentBadge("var(--warning)"),
  done: createAccentBadge("var(--success)"),
  cancelled: createAccentBadge("var(--danger)"),
  idle: createNeutralBadge(),
  running: createAccentBadge("var(--success)"),
  paused: createAccentBadge("var(--warning)"),
  error: createAccentBadge("var(--danger)")
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
        className
      )}
      style={
        palettes[resolvedStatus] ?? {
          borderColor: "var(--border-weak)",
          background: "var(--card-bg)",
          color: "var(--text-secondary)"
        }
      }
      {...props}
    >
      {children ?? humanize(resolvedStatus)}
    </span>
  );
}

function createAccentBadge(color: string): CSSProperties {
  return {
    borderColor: `color-mix(in srgb, ${color} 34%, var(--border-weak))`,
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    color: `color-mix(in srgb, ${color} 72%, var(--text-primary))`
  };
}

function createNeutralBadge(): CSSProperties {
  return {
    borderColor: "var(--border-weak)",
    background: "var(--card-bg)",
    color: "var(--text-secondary)"
  };
}
