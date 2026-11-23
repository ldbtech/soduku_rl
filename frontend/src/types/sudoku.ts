/** Shared Sudoku domain types. No React, no backend imports — safe anywhere. */

/** 0 = empty, 1..N = filled digit. */
export type CellValue = number;

/** Row-major grid: grid[row][col]. */
export type Grid = CellValue[][];

/** Pencil-mark notes per cell, kept sorted ascending. */
export type NotesGrid = number[][][];

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

/** Dimensions of one sub-box, e.g. 3x3 boxes on a 9x9 board. */
export interface BoxLayout {
  rows: number;
  cols: number;
}

/** Fully-validated board description. Only constructible via validation. */
export interface BoardSpec {
  size: number;
  boxRows: number;
  boxCols: number;
}

export interface CellPosition {
  row: number;
  col: number;
}

export function cellKey(pos: CellPosition): string {
  return `${pos.row},${pos.col}`;
}

export type GameStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "won"
  | "lost";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "playing"
  | "paused"
  | "done"
  | "error";

export interface AgentMove extends CellPosition {
  value: number;
  /** Policy confidence 0..1 when the backend reports it. */
  confidence?: number;
}
