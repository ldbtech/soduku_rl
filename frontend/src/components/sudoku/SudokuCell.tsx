import { memo } from "react";
import { cn } from "../ui/cn";

export interface SudokuCellProps {
  row: number;
  col: number;
  size: number;
  value: number;
  notes: number[];
  isGiven: boolean;
  isSelected: boolean;
  isRelated: boolean;
  isSameValue: boolean;
  isConflict: boolean;
  isHint: boolean;
  isAgentMove: boolean;
  interactive: boolean;
  onSelect: (row: number, col: number) => void;
}

function valueFontSize(size: number): string {
  if (size <= 6) return "text-[26px]";
  if (size <= 9) return "text-[22px] sm:text-2xl";
  if (size <= 12) return "text-base sm:text-lg";
  return "text-[13px] sm:text-[15px]";
}

/** One board cell: digit, positional pencil marks, and highlight states. */
export const SudokuCell = memo(function SudokuCell({
  row,
  col,
  size,
  value,
  notes,
  isGiven,
  isSelected,
  isRelated,
  isSameValue,
  isConflict,
  isHint,
  isAgentMove,
  interactive,
  onSelect,
}: SudokuCellProps) {
  const showNotes = value === 0 && notes.length > 0;
  const noteCols = size <= 9 ? 3 : 4;

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`Row ${row + 1} column ${col + 1}${value === 0 ? ", empty" : `, ${value}`}`}
      aria-selected={isSelected}
      disabled={!interactive}
      onClick={() => onSelect(row, col)}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-[5px] leading-none tabular-nums transition-colors duration-100 outline-none select-none",
        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
        interactive ? "cursor-pointer" : "cursor-default",
        isSelected
          ? "z-10 bg-blue-600 font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.45)] dark:bg-blue-500"
          : isSameValue
            ? "bg-blue-600/[0.13] dark:bg-blue-500/25"
            : isRelated
              ? "bg-black/[0.04] dark:bg-white/[0.07]"
              : "bg-white dark:bg-zinc-900",
        !isSelected && isAgentMove && "bg-amber-400/25 dark:bg-amber-400/20",
        !isSelected && isHint && "bg-emerald-500/20 dark:bg-emerald-500/25",
        !isSelected && value !== 0 && "font-semibold",
        !isSelected &&
          value !== 0 &&
          (isConflict
            ? "text-red-600 dark:text-red-400"
            : isGiven
              ? "text-zinc-900 dark:text-white"
              : "text-blue-700 dark:text-blue-300"),
        !isSelected &&
          isConflict &&
          value !== 0 &&
          "bg-red-500/10 dark:bg-red-500/15",
        valueFontSize(size),
      )}
    >
      {value !== 0 ? (
        <span aria-hidden>{value}</span>
      ) : showNotes ? (
        <span
          aria-hidden
          className="grid h-full w-full place-items-center p-[3px]"
          style={{
            gridTemplateColumns: `repeat(${noteCols}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: noteCols * Math.ceil(size / noteCols) }, (_, i) => {
            const n = i + 1;
            if (n > size) return <span key={n} />;
            return (
              <span
                key={n}
                className={cn(
                  "leading-none font-medium",
                  size <= 9 ? "text-[9px]" : "text-[7px]",
                  notes.includes(n)
                    ? isSelected
                      ? "text-white"
                      : "text-zinc-500 dark:text-zinc-400"
                    : "text-transparent",
                )}
              >
                {n}
              </span>
            );
          })}
        </span>
      ) : null}
    </button>
  );
});
