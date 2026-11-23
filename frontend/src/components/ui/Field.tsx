import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

/** Label + control + hint/error line. */
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs leading-5 font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Rounded text input with focus ring + invalid state. */
export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid}
      className={cn(
        "h-10 w-full rounded-xl border bg-white px-3.5 text-[15px] text-zinc-900 tabular-nums transition-colors outline-none",
        "placeholder:text-zinc-400 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
        invalid
          ? "border-red-500 dark:border-red-500"
          : "border-black/10 dark:border-white/15",
        className,
      )}
      {...rest}
    />
  );
}
