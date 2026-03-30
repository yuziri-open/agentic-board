import type { ButtonHTMLAttributes } from "react";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const variants = {
  default:
    "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 focus-visible:outline-indigo-300",
  outline:
    "border border-white/12 bg-white/[0.03] text-slate-100 hover:border-indigo-400/40 hover:bg-indigo-500/10 focus-visible:outline-indigo-300",
  ghost:
    "bg-transparent text-slate-200 hover:bg-white/6 hover:text-white focus-visible:outline-indigo-300"
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
