import type { ReactNode } from "react";
import { cn } from "./cn";

/** Pulsing placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-lg bg-black/[0.06] dark:bg-white/10",
        className,
      )}
    />
  );
}

export interface StatProps {
  label: string;
  value: ReactNode;
  sub?: string;
}

/** Compact label/value readout for stat rows. */
export function Stat({ label, value, sub }: StatProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-lg leading-7 font-bold text-zinc-900 tabular-nums dark:text-white">
        {value}
      </p>
      <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
        {sub ? ` · ${sub}` : ""}
      </p>
    </div>
  );
}

export interface ProgressBarProps {
  value: number;
  ariaLabel: string;
}

/** Thin determinate progress bar. `value` is 0..1. */
export function ProgressBar({ value, ariaLabel }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10"
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-300 dark:bg-blue-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
