export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
}

/** Labeled range slider with a live value readout. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
  disabled = false,
}: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
          {label}
        </label>
        <span className="text-[13px] font-bold text-zinc-900 tabular-nums dark:text-white">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        className="slider mt-2 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
