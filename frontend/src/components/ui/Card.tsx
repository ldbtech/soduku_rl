import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
} as const;

/** Elevated surface card. Pair with SectionTitle for headed sections. */
export function Card({ padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.12)]",
        "dark:border-white/10 dark:bg-zinc-900 dark:shadow-none",
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
}

export function SectionTitle({
  className,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-[13px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400",
        className,
      )}
      {...rest}
    />
  );
}
