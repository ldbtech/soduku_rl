import { cn } from "./cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
}

/** iOS-style segmented picker for a small set of mutually exclusive options. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex w-full rounded-2xl bg-black/[0.05] p-1 dark:bg-white/10"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 cursor-pointer rounded-xl font-semibold whitespace-nowrap transition-all duration-150",
              "outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-[13px]",
              selected
                ? "bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
