import type { ButtonHTMLAttributes } from "react";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const variants = {
  default:
    "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-lg hover:opacity-90 focus-visible:outline-[var(--accent)]",
  outline:
    "border border-[var(--border-weak)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-very-soft)] focus-visible:outline-[var(--accent)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--accent-very-soft)] hover:text-[var(--text-primary)] focus-visible:outline-[var(--accent)]"
} as const;

const sizes = {
  default: "h-11 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  icon: "h-10 w-10 justify-center px-0"
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, size = "default", type = "button", variant = "default", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
