/**
 * Pure board math: layouts, grid helpers, rule checks.
 * These helpers never touch the network — the backend stays authoritative
 * for puzzles and solutions; this module only powers rendering and UX.
 */
import type {
  BoardSpec,
  BoxLayout,
  CellPosition,
  Difficulty,
  Grid,
} from "../types/sudoku";

export const MIN_BOARD_SIZE = 4;
export const MAX_BOARD_SIZE = 16;

/** Preset sizes offered in the UI. Custom sizes go through backend validation. */
export const PRESET_SIZES = [4, 6, 9, 12, 16] as const;

/**
 * Box layout for a size, preferring the squarest factor pair (r <= c, r >= 2).
 * Returns null when no valid Sudoku layout exists (primes, out of range).
 */
export function boxLayoutForSize(size: number): BoxLayout | null {
  if (!Number.isInteger(size) || size < MIN_BOARD_SIZE || size > MAX_BOARD_SIZE) {
    return null;
  }
  let best: BoxLayout | null = null;
  for (let r = 2; r * r <= size; r += 1) {
    if (size % r === 0) {
      const c = size / r;
      if (!best || c - r < best.cols - best.rows) {
        best = { rows: r, cols: c };
      }
    }
  }
  return best;
}

export function specForSize(size: number): BoardSpec | null {
  const box = boxLayoutForSize(size);
  if (!box) return null;
  return { size, boxRows: box.rows, boxCols: box.cols };
}

/** Nearest playable sizes, for "did you mean?" validation messages. */
export function suggestSizes(size: number, count = 3): number[] {
  const valid: number[] = [];
  for (let n = MIN_BOARD_SIZE; n <= MAX_BOARD_SIZE; n += 1) {
    if (boxLayoutForSize(n)) valid.push(n);
  }
  return valid
    .sort((a, b) => Math.abs(a - size) - Math.abs(b - size))
    .slice(0, count)
    .sort((a, b) => a - b);
}

export function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

export function countFilled(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const v of row) if (v !== 0) n += 1;
  return n;
}

export function isComplete(grid: Grid): boolean {
  return grid.every((row) => row.every((v) => v !== 0));
}

export function boxOrigin(
  spec: BoardSpec,
  row: number,
  col: number,
): CellPosition {
  return {
    row: Math.floor(row / spec.boxRows) * spec.boxRows,
    col: Math.floor(col / spec.boxCols) * spec.boxCols,
  };
}

export function inSameBox(
  spec: BoardSpec,
  a: CellPosition,
  b: CellPosition,
): boolean {
  const oa = boxOrigin(spec, a.row, a.col);
  const ob = boxOrigin(spec, b.row, b.col);
  return oa.row === ob.row && oa.col === ob.col;
}

/**
 * Would `value` break row/column/box uniqueness? The cell itself is ignored,
 * so this works for both empty targets and overwrites.
 */
export function isPlacementValid(
  grid: Grid,
  spec: BoardSpec,
  row: number,
  col: number,
  value: number,
): boolean {
  if (value < 1 || value > spec.size) return false;
  for (let c = 0; c < spec.size; c += 1) {
    if (c !== col && grid[row][c] === value) return false;
  }
  for (let r = 0; r < spec.size; r += 1) {
    if (r !== row && grid[r][col] === value) return false;
  }
  const origin = boxOrigin(spec, row, col);
  for (let r = origin.row; r < origin.row + spec.boxRows; r += 1) {
    for (let c = origin.col; c < origin.col + spec.boxCols; c += 1) {
      if ((r !== row || c !== col) && grid[r][c] === value) return false;
    }
  }
  return true;
}

/** All cells participating in a duplicate, keyed as "row,col". */
export function findConflicts(grid: Grid, spec: BoardSpec): Set<string> {
  const conflicts = new Set<string>();
  const scanUnit = (cells: CellPosition[]) => {
    const seen = new Map<number, CellPosition[]>();
    for (const pos of cells) {
      const v = grid[pos.row][pos.col];
      if (v === 0) continue;
      const list = seen.get(v) ?? [];
      list.push(pos);
      seen.set(v, list);
    }
    for (const list of seen.values()) {
      if (list.length > 1) {
        for (const pos of list) conflicts.add(`${pos.row},${pos.col}`);
      }
    }
  };

  for (let r = 0; r < spec.size; r += 1) {
    scanUnit(
      Array.from({ length: spec.size }, (_, c) => ({ row: r, col: c })),
    );
  }
  for (let c = 0; c < spec.size; c += 1) {
    scanUnit(
      Array.from({ length: spec.size }, (_, r) => ({ row: r, col: c })),
    );
  }
  for (let br = 0; br < spec.size; br += spec.boxRows) {
    for (let bc = 0; bc < spec.size; bc += spec.boxCols) {
      const cells: CellPosition[] = [];
      for (let r = br; r < br + spec.boxRows; r += 1) {
        for (let c = bc; c < bc + spec.boxCols; c += 1) {
          cells.push({ row: r, col: c });
        }
      }
      scanUnit(cells);
    }
  }
  return conflicts;
}

/** Legal candidates for an empty cell (empty array when already filled). */
export function candidatesFor(
  grid: Grid,
  spec: BoardSpec,
  row: number,
  col: number,
): number[] {
  if (grid[row][col] !== 0) return [];
  const out: number[] = [];
  for (let v = 1; v <= spec.size; v += 1) {
    if (isPlacementValid(grid, spec, row, col, v)) out.push(v);
  }
  return out;
}

/** How many of each digit are still missing; index 0 unused. */
export function remainingCounts(grid: Grid, spec: BoardSpec): number[] {
  const counts = Array<number>(spec.size + 1).fill(spec.size);
  for (const row of grid) {
    for (const v of row) {
      if (v >= 1 && v <= spec.size) counts[v] -= 1;
    }
  }
  return counts;
}

export interface DifficultyMeta {
  label: string;
  blurb: string;
  /** Fraction of cells removed when carving the puzzle. */
  holes: number;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  easy: { label: "Easy", blurb: "Relaxed — plenty of givens.", holes: 0.42 },
  medium: { label: "Medium", blurb: "A balanced daily challenge.", holes: 0.52 },
  hard: { label: "Hard", blurb: "Few givens, real deduction.", holes: 0.6 },
  expert: { label: "Expert", blurb: "Minimal clues. Good luck.", holes: 0.66 },
};

export function formatValue(value: number): string {
  return String(value);
}

export function sizeLabel(spec: BoardSpec): string {
  return `${spec.size}×${spec.size}`;
}

export function boxLabel(spec: BoardSpec): string {
  return `${spec.boxRows}×${spec.boxCols} boxes`;
}
