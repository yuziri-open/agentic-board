import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "./button";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel overflow-hidden", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold tracking-tight text-[var(--text-primary)]", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--text-secondary)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardStat({
  eyebrow,
  value,
  trend
}: PropsWithChildren<{ eyebrow: string; value: string; trend?: string }>) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-tertiary)]">{eyebrow}</p>
      <p className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
      {trend ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{trend}</p> : null}
    </div>
  );
}
