import { cn } from "./cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

/** iOS-style toggle, bare or with a label row. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: SwitchProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-600 dark:bg-blue-500" : "bg-black/15 dark:bg-white/20",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-150",
          checked && "translate-x-5",
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}
