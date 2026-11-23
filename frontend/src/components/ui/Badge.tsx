import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral:
    "bg-black/[0.06] text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
  info: "bg-blue-600/10 text-blue-700 dark:text-blue-300",
  success: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-red-600/10 text-red-600 dark:text-red-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
}

/** Small tonal status pill, optionally with a live dot. */
export function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}
