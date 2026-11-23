import { useEffect, useState } from "react";
import { BookOpenText, ChevronDown, Lightbulb, RotateCcw } from "lucide-react";
import type { SudokuBackend } from "../../api/backend";
import type { RulesResponse } from "../../api/backend";
import { cn } from "../ui/cn";
import { Button } from "../ui/Button";
import { Card, SectionTitle } from "../ui/Card";
import { Skeleton } from "../ui/Stat";

export interface RulesPanelProps {
  backend: SudokuBackend;
  size: number;
}

/** Board-size-aware rules + tips, fetched from the backend. Collapsible. */
export function RulesPanel({ backend, size }: RulesPanelProps) {
  const [open, setOpen] = useState(true);
  const [rules, setRules] = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void backend
      .fetchRules(size)
      .then((res) => {
        if (cancelled) return;
        setRules(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load rules.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [backend, size]);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-lg"
      >
        <span className="flex items-center gap-2">
          <BookOpenText className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <SectionTitle>{rules?.title ?? `How to play ${size}×${size}`}</SectionTitle>
        </span>
        <ChevronDown
          className={cn("size-4 text-zinc-500 transition-transform duration-200", !open && "-rotate-90")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="mt-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button
                size="sm"
                variant="tonal"
                icon={<RotateCcw className="size-3.5" aria-hidden />}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  void backend
                    .fetchRules(size)
                    .then((res) => {
                      setRules(res);
                      setLoading(false);
                    })
                    .catch((err: unknown) => {
                      setError(err instanceof Error ? err.message : "Failed to load rules.");
                      setLoading(false);
                    });
                }}
              >
                Retry
              </Button>
            </div>
          ) : rules ? (
            <div className="space-y-3">
              <ol className="space-y-2">
                {rules.rules.map((rule, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                    <span
                      aria-hidden
                      className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-blue-600/10 text-[11px] font-bold text-blue-700 tabular-nums dark:text-blue-300"
                    >
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ol>
              <div className="rounded-2xl bg-amber-500/[0.08] p-3 dark:bg-amber-400/10">
                <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                  <Lightbulb className="size-3.5" aria-hidden /> Tips
                </p>
                <ul className="mt-1.5 space-y-1">
                  {rules.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[13px] leading-5 text-amber-900/90 dark:text-amber-100/90"
                    >
                      · {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
