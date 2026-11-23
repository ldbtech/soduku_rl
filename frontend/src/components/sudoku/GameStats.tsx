import type { BoardSpec, Difficulty } from "../../types/sudoku";
import { DIFFICULTY_META, sizeLabel } from "../../lib/sudoku";
import { formatTime } from "../../lib/format";
import { Badge } from "../ui/Badge";
import { Card, SectionTitle } from "../ui/Card";
import { ProgressBar, Stat } from "../ui/Stat";

export interface GameStatsProps {
  spec: BoardSpec;
  difficulty: Difficulty;
  elapsed: number;
  mistakes: number;
  mistakesLimit: number;
  hintsUsed: number;
  filledCount: number;
  totalCount: number;
}

/** Live game readout: time, mistakes, hints, difficulty, and completion. */
export function GameStats({
  spec,
  difficulty,
  elapsed,
  mistakes,
  mistakesLimit,
  hintsUsed,
  filledCount,
  totalCount,
}: GameStatsProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <SectionTitle>Game</SectionTitle>
        <div className="flex gap-1.5">
          <Badge variant="info">{sizeLabel(spec)}</Badge>
          <Badge variant="neutral">{DIFFICULTY_META[difficulty].label}</Badge>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Time" value={formatTime(elapsed)} />
        <Stat
          label="Mistakes"
          value={`${mistakes} / ${mistakesLimit}`}
        />
        <Stat label="Hints" value={hintsUsed} />
      </div>
      <div className="mt-3">
        <ProgressBar
          ariaLabel="Board completion"
          value={totalCount === 0 ? 0 : filledCount / totalCount}
        />
        <p className="mt-1.5 text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
          {filledCount} of {totalCount} cells filled
        </p>
      </div>
    </Card>
  );
}
