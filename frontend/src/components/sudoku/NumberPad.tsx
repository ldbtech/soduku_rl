import { cn } from "../ui/cn";

export interface NumberPadProps {
  size: number;
  /** Remaining count per digit; index 0 unused. */
  counts: number[];
  onInput: (value: number) => void;
  disabled?: boolean;
}

function columnsForSize(size: number): number {
  if (size <= 6) return size;
  if (size <= 9) return 9;
  if (size <= 12) return 6;
  return 8;
}

/** Digit entry pad with remaining-count badges. Adapts to any board size. */
export function NumberPad({ size, counts, onInput, disabled = false }: NumberPadProps) {
  return (
    <div
      role="group"
      aria-label="Number pad"
      className="grid gap-1.5 sm:gap-2"
      style={{
        gridTemplateColumns: `repeat(${columnsForSize(size)}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: size }, (_, i) => i + 1).map((value) => {
        const remaining = counts[value] ?? 0;
        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onInput(value)}
            aria-label={`Enter ${value} (${remaining} remaining)`}
            className={cn(
              "flex h-12 cursor-pointer flex-col items-center justify-center rounded-xl transition-[background-color,transform] duration-100 outline-none select-none",
              "bg-black/[0.045] hover:bg-blue-600/10 active:scale-[0.96] dark:bg-white/[0.07] dark:hover:bg-blue-500/20",
              "focus-visible:ring-2 focus-visible:ring-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
            )}
          >
            <span
              className={cn(
                "leading-none font-semibold text-zinc-900 tabular-nums dark:text-white",
                size > 9 ? "text-base" : "text-lg",
                remaining === 0 && "opacity-30",
              )}
            >
              {value}
            </span>
            <span className="mt-0.5 text-[10px] leading-none font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
              {remaining}
            </span>
          </button>
        );
      })}
    </div>
  );
}
