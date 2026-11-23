import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { SudokuBackend } from "../../api/backend";
import { specFromValidation } from "../../api/backend";
import type { BoardSpec } from "../../types/sudoku";
import { boxLayoutForSize, PRESET_SIZES } from "../../lib/sudoku";
import { cn } from "../ui/cn";
import { Field, Input } from "../ui/Field";

type CheckState = "idle" | "checking" | "valid" | "invalid";

export interface BoardSizeSelectorProps {
  backend: SudokuBackend;
  initialSize?: number;
  onValidation: (spec: BoardSpec | null) => void;
}

/**
 * Board-size picker: preset cards plus a custom size field. Every choice is
 * validated by the backend before it is accepted — invalid sizes surface the
 * server message with clickable "did you mean" suggestions.
 */
export function BoardSizeSelector({
  backend,
  initialSize = 9,
  onValidation,
}: BoardSizeSelectorProps) {
  const initialPreset = (PRESET_SIZES as readonly number[]).includes(initialSize)
    ? initialSize
    : null;
  const [preset, setPreset] = useState<number | null>(initialPreset);
  const [customText, setCustomText] = useState(initialPreset === null ? String(initialSize) : "");
  const [check, setCheck] = useState<{
    state: CheckState;
    message: string;
    suggestions: number[];
  }>({ state: "idle", message: "", suggestions: [] });

  const seqRef = useRef(0);
  const onValidationRef = useRef(onValidation);
  onValidationRef.current = onValidation;

  const resolved = preset ?? Number.parseInt(customText, 10);

  useEffect(() => {
    const seq = (seqRef.current += 1);
    if (!Number.isInteger(resolved)) {
      setCheck({ state: "idle", message: "", suggestions: [] });
      onValidationRef.current(null);
      return;
    }
    // Presets validate immediately; custom input is debounced while typing.
    const delay = preset !== null ? 0 : 450;
    setCheck((c) => ({ ...c, state: "checking", message: "Checking with server…" }));
    const timer = window.setTimeout(() => {
      void backend
        .validateBoardSize({ size: resolved })
        .then((res) => {
          if (seq !== seqRef.current) return;
          if (res.valid) {
            setCheck({
              state: "valid",
              message: res.message ?? "Valid board size.",
              suggestions: [],
            });
            onValidationRef.current(specFromValidation(res));
          } else {
            setCheck({
              state: "invalid",
              message: res.message ?? "Invalid board size.",
              suggestions: res.suggestions ?? [],
            });
            onValidationRef.current(null);
          }
        })
        .catch((err: unknown) => {
          if (seq !== seqRef.current) return;
          setCheck({
            state: "invalid",
            message: err instanceof Error ? err.message : "Validation failed.",
            suggestions: [],
          });
          onValidationRef.current(null);
        });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [resolved, preset, backend]);

  const pickSuggestion = (size: number) => {
    if ((PRESET_SIZES as readonly number[]).includes(size)) {
      setPreset(size);
      setCustomText("");
    } else {
      setPreset(null);
      setCustomText(String(size));
    }
  };

  return (
    <div>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Preset board sizes">
        {PRESET_SIZES.map((size) => {
          const box = boxLayoutForSize(size);
          const active = preset === size;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setPreset(size);
                setCustomText("");
              }}
              className={cn(
                "cursor-pointer rounded-2xl border px-1 py-2.5 text-center transition-all duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500",
                active
                  ? "border-blue-600 bg-blue-600/[0.07] ring-2 ring-blue-500/25 dark:border-blue-500"
                  : "border-black/10 hover:border-black/30 dark:border-white/15 dark:hover:border-white/35",
              )}
            >
              <span className="block text-[15px] font-bold text-zinc-900 tabular-nums dark:text-white">
                {size}×{size}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                {box ? `${box.rows}×${box.cols}` : "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <Field label="Or enter a custom size">
          <div className="relative">
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 8 or 10"
              value={customText}
              invalid={check.state === "invalid"}
              onChange={(e) => {
                setPreset(null);
                setCustomText(e.target.value.replace(/[^0-9]/g, "").slice(0, 2));
              }}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2">
              {check.state === "checking" && (
                <Loader2 className="size-4 animate-spin text-zinc-400" aria-hidden />
              )}
              {check.state === "valid" && (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
              )}
              {check.state === "invalid" && (
                <AlertCircle className="size-4 text-red-500" aria-hidden />
              )}
            </span>
          </div>
        </Field>
      </div>

      {check.state !== "idle" && check.message && (
        <p
          role={check.state === "invalid" ? "alert" : "status"}
          className={cn(
            "mt-2 text-[13px] leading-5 font-medium",
            check.state === "valid" && "text-emerald-700 dark:text-emerald-300",
            check.state === "invalid" && "text-red-600 dark:text-red-400",
            check.state === "checking" && "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {check.message}
        </p>
      )}

      {check.state === "invalid" && check.suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {check.suggestions.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => pickSuggestion(size)}
              className="cursor-pointer rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 tabular-nums transition-colors hover:bg-blue-600/20 dark:text-blue-300"
            >
              Try {size}×{size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
