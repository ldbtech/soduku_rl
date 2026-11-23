/**
 * Puzzle generator used by the mock backend. The real backend owns generation
 * in production; this keeps local development fully playable offline.
 */
import type { BoardSpec, Difficulty, Grid } from "../types/sudoku";
import {
  candidatesFor,
  cloneGrid,
  createEmptyGrid,
  DIFFICULTY_META,
} from "./sudoku";

export type Rng = () => number;

/** Deterministic PRNG so puzzles are reproducible from a seed. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface EmptyCell {
  row: number;
  col: number;
  candidates: number[];
}

/** Most-constrained empty cell (MRV heuristic); null when grid is full. */
function pickCell(grid: Grid, spec: BoardSpec): EmptyCell | null {
  let best: EmptyCell | null = null;
  for (let r = 0; r < spec.size; r += 1) {
    for (let c = 0; c < spec.size; c += 1) {
      if (grid[r][c] !== 0) continue;
      const candidates = candidatesFor(grid, spec, r, c);
      if (candidates.length === 0) {
        return { row: r, col: c, candidates };
      }
      if (!best || candidates.length < best.candidates.length) {
        best = { row: r, col: c, candidates };
        if (candidates.length === 1) return best;
      }
    }
  }
  return best;
}

/** Count solutions up to `limit`. Mutates `grid` but restores it. */
export function countSolutions(
  grid: Grid,
  spec: BoardSpec,
  limit: number,
): number {
  const cell = pickCell(grid, spec);
  if (!cell) return 1;
  if (cell.candidates.length === 0) return 0;
  let total = 0;
  for (const v of cell.candidates) {
    grid[cell.row][cell.col] = v;
    total += countSolutions(grid, spec, limit - total);
    grid[cell.row][cell.col] = 0;
    if (total >= limit) break;
  }
  return total;
}

/** Fill `grid` in place with a complete valid solution. */
function solveOnce(grid: Grid, spec: BoardSpec, rng: Rng): boolean {
  const cell = pickCell(grid, spec);
  if (!cell) return true;
  for (const v of shuffled(cell.candidates, rng)) {
    grid[cell.row][cell.col] = v;
    if (solveOnce(grid, spec, rng)) return true;
    grid[cell.row][cell.col] = 0;
  }
  return false;
}

export function generateSolution(spec: BoardSpec, rng: Rng): Grid {
  const grid = createEmptyGrid(spec.size);
  if (!solveOnce(grid, spec, rng)) {
    throw new Error(`Failed to generate a ${spec.size}x${spec.size} solution`);
  }
  return grid;
}

/**
 * Remove cells to reach the difficulty's hole target. For 9x9 and smaller,
 * every removal is uniqueness-checked so puzzles have exactly one solution.
 * Larger boards use pure random removal (uniqueness checks get expensive)
 * while staying solvable — the known solution is always valid.
 */
export function carvePuzzle(
  solution: Grid,
  spec: BoardSpec,
  difficulty: Difficulty,
  rng: Rng,
): Grid {
  const puzzle = cloneGrid(solution);
  const target = Math.floor(
    spec.size * spec.size * DIFFICULTY_META[difficulty].holes,
  );
  const cells = shuffled(
    Array.from({ length: spec.size * spec.size }, (_, i) => ({
      row: Math.floor(i / spec.size),
      col: i % spec.size,
    })),
    rng,
  );
  let removed = 0;
  for (const cell of cells) {
    if (removed >= target) break;
    const backup = puzzle[cell.row][cell.col];
    puzzle[cell.row][cell.col] = 0;
    if (spec.size <= 9) {
      const probe = cloneGrid(puzzle);
      if (countSolutions(probe, spec, 2) !== 1) {
        puzzle[cell.row][cell.col] = backup;
        continue;
      }
    }
    removed += 1;
  }
  return puzzle;
}
