import { useState } from "react";
import { Play } from "lucide-react";
import type { SudokuBackend } from "../../api/backend";
import type { BoardSpec, Difficulty } from "../../types/sudoku";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { BoardSizeSelector } from "./BoardSizeSelector";
import { DifficultySelector } from "./DifficultySelector";

export interface NewGameDialogProps {
  open: boolean;
  backend: SudokuBackend;
  starting: boolean;
  defaultSize?: number;
  defaultDifficulty?: Difficulty;
  onClose: () => void;
  onStart: (size: number, difficulty: Difficulty) => Promise<boolean>;
}

/**
 * New-game setup: size (backend-validated) + difficulty.
 * Start stays disabled until the server accepts the board size.
 */
export function NewGameDialog({
  open,
  backend,
  starting,
  defaultSize = 9,
  defaultDifficulty = "medium",
  onClose,
  onStart,
}: NewGameDialogProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [validSpec, setValidSpec] = useState<BoardSpec | null>(null);

  const handleStart = async () => {
    if (!validSpec || starting) return;
    const ok = await onStart(validSpec.size, difficulty);
    if (ok) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New game"
      description="Pick a board size and difficulty. Sizes are validated by the server before the puzzle is generated."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={starting}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!validSpec || starting}
            loading={starting}
            icon={<Play className="size-4" aria-hidden />}
          >
            {validSpec ? `Start ${validSpec.size}×${validSpec.size}` : "Start"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <BoardSizeSelector
          backend={backend}
          initialSize={defaultSize}
          onValidation={setValidSpec}
        />
        <DifficultySelector value={difficulty} onChange={setDifficulty} />
      </div>
    </Dialog>
  );
}
