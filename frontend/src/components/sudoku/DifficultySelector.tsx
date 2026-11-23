import type { Difficulty } from "../../types/sudoku";
import { DIFFICULTY_META } from "../../lib/sudoku";
import { SegmentedControl } from "../ui/SegmentedControl";

export interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

/** Difficulty picker with a one-line description of the level. */
export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div>
      <SegmentedControl<Difficulty>
        ariaLabel="Difficulty"
        value={value}
        onChange={onChange}
        options={(Object.keys(DIFFICULTY_META) as Difficulty[]).map((d) => ({
          value: d,
          label: DIFFICULTY_META[d].label,
        }))}
      />
      <p className="mt-1.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {DIFFICULTY_META[value].blurb}
      </p>
    </div>
  );
}
