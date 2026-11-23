import { HeartCrack, RotateCcw, Trophy } from "lucide-react";
import type { Difficulty } from "../../types/sudoku";
import { DIFFICULTY_META } from "../../lib/sudoku";
import { formatTime } from "../../lib/format";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

export interface GameOverStats {
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: Difficulty;
  size: number;
}

export interface GameOverDialogProps {
  outcome: "won" | "lost" | null;
  stats: GameOverStats;
  onViewBoard: () => void;
  onRetry: () => void;
  onNewGame: () => void;
}

/** Win/lose summary with time, mistakes, hints, and next actions. */
export function GameOverDialog({
  outcome,
  stats,
  onViewBoard,
  onRetry,
  onNewGame,
}: GameOverDialogProps) {
  const won = outcome === "won";
  return (
    <Dialog
      open={outcome !== null}
      onClose={onViewBoard}
      title={won ? "Puzzle solved" : "Out of mistakes"}
      description={
        won
          ? `Clean solve on ${stats.size}×${stats.size} ${DIFFICULTY_META[stats.difficulty].label}.`
          : `Three strikes on ${stats.size}×${stats.size} ${DIFFICULTY_META[stats.difficulty].label}. The board is still yours to study.`
      }
      footer={
        won ? (
          <>
            <Button variant="ghost" onClick={onViewBoard}>
              View board
            </Button>
            <Button onClick={onNewGame}>New game</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onViewBoard}>
              View board
            </Button>
            <Button
              variant="secondary"
              icon={<RotateCcw className="size-4" aria-hidden />}
              onClick={onRetry}
            >
              Try again
            </Button>
            <Button onClick={onNewGame}>New game</Button>
          </>
        )
      }
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={
            won
              ? "grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
              : "grid size-14 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-500"
          }
        >
          {won ? <Trophy className="size-7" /> : <HeartCrack className="size-7" />}
        </span>
        <dl className="grid flex-1 grid-cols-3 gap-3 text-center">
          {[
            { label: "Time", value: formatTime(stats.elapsed) },
            { label: "Mistakes", value: String(stats.mistakes) },
            { label: "Hints", value: String(stats.hintsUsed) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-black/[0.04] px-2 py-2.5 dark:bg-white/[0.07]"
            >
              <dt className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {s.label}
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-zinc-900 tabular-nums dark:text-white">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Dialog>
  );
}
