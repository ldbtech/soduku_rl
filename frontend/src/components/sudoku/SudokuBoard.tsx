import { useCallback } from "react";
import type { BoardSpec, CellPosition, Grid, NotesGrid } from "../../types/sudoku";
import type { AgentMove } from "../../types/sudoku";
import { inSameBox } from "../../lib/sudoku";
import { SudokuCell } from "./SudokuCell";

export interface SudokuBoardProps {
  spec: BoardSpec;
  puzzle: Grid;
  grid: Grid;
  notes: NotesGrid;
  selected: CellPosition | null;
  conflicts: Set<string>;
  hintCell: CellPosition | null;
  agentLastMove: AgentMove | null;
  highlightRelated: boolean;
  highlightSame: boolean;
  interactive: boolean;
  onSelect: (pos: CellPosition) => void;
}

/**
 * Generic N×N board rendered as a grid of box sub-grids, so hairlines sit
 * between cells and real gutters sit between boxes — at any board size.
 */
export function SudokuBoard({
  spec,
  puzzle,
  grid,
  notes,
  selected,
  conflicts,
  hintCell,
  agentLastMove,
  highlightRelated,
  highlightSame,
  interactive,
  onSelect,
}: SudokuBoardProps) {
  const boxesAcross = spec.size / spec.boxCols;
  const boxesDown = spec.size / spec.boxRows;
  const selectedValue =
    selected && grid[selected.row] ? (grid[selected.row][selected.col] ?? 0) : 0;

  const handleSelect = useCallback(
    (row: number, col: number) => onSelect({ row, col }),
    [onSelect],
  );

  const boxes = [];
  for (let br = 0; br < boxesDown; br += 1) {
    for (let bc = 0; bc < boxesAcross; bc += 1) {
      const cells = [];
      for (let r = 0; r < spec.boxRows; r += 1) {
        for (let c = 0; c < spec.boxCols; c += 1) {
          const row = br * spec.boxRows + r;
          const col = bc * spec.boxCols + c;
          const value = grid[row][col];
          const isSelected =
            !!selected && selected.row === row && selected.col === col;
          const isRelated =
            !!selected &&
            !isSelected &&
            (selected.row === row ||
              selected.col === col ||
              inSameBox(spec, selected, { row, col }));
          cells.push(
            <SudokuCell
              key={`${row}-${col}`}
              row={row}
              col={col}
              size={spec.size}
              value={value}
              notes={notes[row][col]}
              isGiven={puzzle[row][col] !== 0}
              isSelected={isSelected}
              isRelated={highlightRelated && isRelated}
              isSameValue={
                highlightSame &&
                !isSelected &&
                selectedValue !== 0 &&
                value === selectedValue
              }
              isConflict={conflicts.has(`${row},${col}`)}
              isHint={!!hintCell && hintCell.row === row && hintCell.col === col}
              isAgentMove={
                !!agentLastMove &&
                agentLastMove.row === row &&
                agentLastMove.col === col
              }
              interactive={interactive}
              onSelect={handleSelect}
            />,
          );
        }
      }
      boxes.push(
        <div
          key={`${br}-${bc}`}
          role="presentation"
          className="grid gap-px overflow-hidden rounded-[10px] bg-zinc-300/80 p-px dark:bg-white/15"
          style={{
            gridTemplateColumns: `repeat(${spec.boxCols}, minmax(0, 1fr))`,
          }}
        >
          {cells}
        </div>,
      );
    }
  }

  return (
    <div
      role="grid"
      aria-label={`${spec.size} by ${spec.size} sudoku board`}
      className="grid w-full gap-1.5 sm:gap-2"
      style={{
        gridTemplateColumns: `repeat(${boxesAcross}, minmax(0, 1fr))`,
      }}
    >
      {boxes}
    </div>
  );
}
