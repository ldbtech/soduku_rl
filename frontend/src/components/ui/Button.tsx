import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tonal"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white shadow-[0_1px_2px_rgba(37,99,235,0.4)] hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-600",
  secondary:
    "bg-zinc-900 text-white hover:bg-zinc-700 active:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:active:bg-zinc-300",
  tonal:
    "bg-blue-600/10 text-blue-700 hover:bg-blue-600/15 active:bg-blue-600/20 dark:text-blue-300",
  ghost:
    "text-zinc-700 hover:bg-black/[0.05] active:bg-black/10 dark:text-zinc-200 dark:hover:bg-white/10 dark:active:bg-white/15",
  destructive:
    "bg-red-600/10 text-red-600 hover:bg-red-600/15 active:bg-red-600/20 dark:text-red-400",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

/** Pill button in five variants. `loading` swaps the icon for a spinner. */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[background-color,transform,opacity] duration-150 select-none",
        "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isActive?: boolean;
}

/** Circular icon-only button with an optional active (tonal) state. */
export function IconButton({
  label,
  isActive = false,
  className,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        "grid size-10 cursor-pointer place-items-center rounded-full transition-[background-color,transform,opacity] duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
        isActive
          ? "bg-blue-600/15 text-blue-700 dark:text-blue-300"
          : "text-zinc-600 hover:bg-black/[0.05] active:bg-black/10 dark:text-zinc-300 dark:hover:bg-white/10",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
