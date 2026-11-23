/**
 * Mock backend: same interface as production, simulated latency, real puzzles.
 * Generates unique-solution puzzles locally so the whole app is playable
 * offline while the real service is being built.
 */
import type {
  AgentMove,
  BoardSpec,
  CellPosition,
  Grid,
} from "../types/sudoku";
import {
  candidatesFor,
  cloneGrid,
  findConflicts,
  isComplete,
  isPlacementValid,
  specForSize,
  suggestSizes,
} from "../lib/sudoku";
import { carvePuzzle, generateSolution, mulberry32 } from "../lib/generator";
import {
  BackendError,
  type AgentMoveRequest,
  type AgentMoveResponse,
  type FetchPuzzleRequest,
  type FetchPuzzleResponse,
  type HintRequest,
  type HintResponse,
  type RulesResponse,
  type SudokuBackend,
  type ValidateMoveRequest,
  type ValidateMoveResponse,
  type ValidateSizeRequest,
  type ValidateSizeResponse,
} from "./backend";

function defaultLatency(): number {
  const raw = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 350);
  if (Number.isNaN(raw)) return 350;
  return Math.min(2000, Math.max(0, raw));
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Which placeholder policy the mock backend plays with.
 * - "random": clicks a random empty cell with a random digit (current
 *   placeholder until the real RL policy lands).
 * - "solver": plays correct solution digits, most-constrained cells first.
 * Switch with `VITE_AGENT_MODE=solver`; the real RL policy will arrive as
 * the HTTP backend, which ignores this entirely.
 */
export type MockAgentMode = "random" | "solver";

export function mockAgentMode(): MockAgentMode {
  return import.meta.env.VITE_AGENT_MODE === "solver" ? "solver" : "random";
}

export class MockSudokuBackend implements SudokuBackend {
  readonly id = "mock" as const;

  /** puzzleId -> solution, so move/hint/agent calls can grade like a server. */
  private solutions = new Map<string, { spec: BoardSpec; solution: Grid }>();

  constructor(private latencyMs: number = defaultLatency()) {}

  private wait(): Promise<void> {
    const jitter = Math.floor(Math.random() * 120);
    return new Promise((resolve) =>
      setTimeout(resolve, this.latencyMs + jitter),
    );
  }

  private remember(puzzleId: string, spec: BoardSpec, solution: Grid): void {
    this.solutions.set(puzzleId, { spec, solution });
    if (this.solutions.size > 20) {
      const oldest = this.solutions.keys().next().value;
      if (oldest) this.solutions.delete(oldest);
    }
  }

  async validateBoardSize(
    req: ValidateSizeRequest,
  ): Promise<ValidateSizeResponse> {
    await this.wait();
    const { size } = req;
    const spec = specForSize(size);
    if (!spec) {
      const suggestions = suggestSizes(
        Number.isInteger(size) ? size : 9,
      );
      return {
        valid: false,
        size,
        boxRows: 0,
        boxCols: 0,
        message: Number.isInteger(size)
          ? `A ${size}×${size} board can't form equal sub-boxes. Try ${suggestions.join(", ")}.`
          : "Board size must be a whole number.",
        suggestions,
      };
    }
    return {
      valid: true,
      size: spec.size,
      boxRows: spec.boxRows,
      boxCols: spec.boxCols,
      message: `${spec.size}×${spec.size} with ${spec.boxRows}×${spec.boxCols} boxes.`,
    };
  }

  async fetchRules(size: number): Promise<RulesResponse> {
    await this.wait();
    const spec = specForSize(size);
    if (!spec) {
      throw new BackendError(`No rules for unsupported size ${size}.`, 400);
    }
    const { boxRows, boxCols } = spec;
    return {
      size,
      title: `How to play ${size}×${size}`,
      rules: [
        `Fill every row with the digits 1–${size}, each exactly once.`,
        `Fill every column with the digits 1–${size}, each exactly once.`,
        `Fill every ${boxRows}×${boxCols} box with the digits 1–${size}, each exactly once.`,
      ],
      tips: [
        "Scan for rows, columns, or boxes that are nearly complete first.",
        "Use Notes mode to pencil in candidates for tricky cells.",
        size > 9
          ? `On large boards, type multi-digit numbers quickly (e.g. “1” then “2” for 12).`
          : "Select a digit on the number pad to highlight all its occurrences.",
        "Stuck? Ask for a hint — it always plays a correct digit.",
      ],
    };
  }

  async fetchPuzzle(req: FetchPuzzleRequest): Promise<FetchPuzzleResponse> {
    await this.wait();
    const spec = specForSize(req.size);
    if (!spec) {
      throw new BackendError(`Unsupported board size ${req.size}.`, 400);
    }
    const seed = req.seed ?? Math.floor(Math.random() * 2 ** 31);
    const rng = mulberry32(seed);
    let solution: Grid | null = null;
    for (let attempt = 0; attempt < 3 && !solution; attempt += 1) {
      try {
        solution = generateSolution(spec, rng);
      } catch {
        solution = null;
      }
    }
    if (!solution) {
      throw new BackendError("Puzzle generator timed out, try again.", 500);
    }
    const puzzle = carvePuzzle(solution, spec, req.difficulty, rng);
    const puzzleId = randomId("mock");
    this.remember(puzzleId, spec, solution);
    return {
      puzzleId,
      size: spec.size,
      boxRows: spec.boxRows,
      boxCols: spec.boxCols,
      difficulty: req.difficulty,
      puzzle,
      solution,
    };
  }

  async validateMove(req: ValidateMoveRequest): Promise<ValidateMoveResponse> {
    await this.wait();
    const spec = specForSize(req.size);
    if (!spec) throw new BackendError(`Unsupported size ${req.size}.`, 400);
    const next = cloneGrid(req.grid);
    next[req.row][req.col] = req.value;
    const conflicts = [...findConflicts(next, spec)].map((key) => {
      const [row, col] = key.split(",").map(Number);
      return { row, col } satisfies CellPosition;
    });
    const legal = isPlacementValid(
      req.grid,
      spec,
      req.row,
      req.col,
      req.value,
    );
    const record = req.puzzleId
      ? this.solutions.get(req.puzzleId)
      : undefined;
    const correct = record
      ? record.solution[req.row][req.col] === req.value
      : undefined;
    const completed = isComplete(next) && conflicts.length === 0;
    return { legal, correct, conflicts, completed };
  }

  async requestHint(req: HintRequest): Promise<HintResponse> {
    await this.wait();
    const spec = specForSize(req.size);
    if (!spec) throw new BackendError(`Unsupported size ${req.size}.`, 400);
    const record = req.puzzleId
      ? this.solutions.get(req.puzzleId)
      : undefined;
    const empties: CellPosition[] = [];
    for (let r = 0; r < spec.size; r += 1) {
      for (let c = 0; c < spec.size; c += 1) {
        if (req.grid[r][c] === 0) empties.push({ row: r, col: c });
      }
    }
    if (empties.length === 0) {
      throw new BackendError("The board is already complete.", 409);
    }
    // Teach: reveal the most constrained cell first.
    let best = empties[0];
    let bestCount = Number.POSITIVE_INFINITY;
    for (const cell of empties) {
      const n = candidatesFor(req.grid, spec, cell.row, cell.col).length;
      if (n < bestCount) {
        best = cell;
        bestCount = n;
        if (n <= 1) break;
      }
    }
    const value = record
      ? record.solution[best.row][best.col]
      : (candidatesFor(req.grid, spec, best.row, best.col)[0] ?? 1);
    return {
      ...best,
      value,
      explanation:
        bestCount <= 1
          ? "Only one digit fits here."
          : `This cell has the fewest options (${bestCount}).`,
    };
  }

  async requestAgentMove(
    req: AgentMoveRequest,
  ): Promise<AgentMoveResponse> {
    // The agent "thinks" a little longer than an API round-trip.
    await this.wait();
    const spec = specForSize(req.size);
    if (!spec) throw new BackendError(`Unsupported size ${req.size}.`, 400);
    const record = req.puzzleId
      ? this.solutions.get(req.puzzleId)
      : undefined;
    const empties: CellPosition[] = [];
    for (let r = 0; r < spec.size; r += 1) {
      for (let c = 0; c < spec.size; c += 1) {
        if (req.grid[r][c] === 0) empties.push({ row: r, col: c });
      }
    }
    if (empties.length === 0) return { move: null, done: true };
    if (mockAgentMode() === "random") {
      // Placeholder policy: pure random clicking until the RL agent lands.
      const picked = empties[Math.floor(Math.random() * empties.length)];
      const move: AgentMove = {
        ...picked,
        value: 1 + Math.floor(Math.random() * spec.size),
      };
      return { move, done: false };
    }
    // RL-style exploration: sample an empty cell, prefer constrained ones.
    const scored = empties.map((cell) => ({
      cell,
      weight:
        1 +
        (spec.size -
          candidatesFor(req.grid, spec, cell.row, cell.col).length),
    }));
    const total = scored.reduce((sum, s) => sum + s.weight, 0);
    let roll = Math.random() * total;
    let picked = scored[0].cell;
    for (const s of scored) {
      roll -= s.weight;
      if (roll <= 0) {
        picked = s.cell;
        break;
      }
    }
    const value = record
      ? record.solution[picked.row][picked.col]
      : (candidatesFor(req.grid, spec, picked.row, picked.col)[0] ?? 1);
    const move: AgentMove = {
      ...picked,
      value,
      confidence: 0.9 + Math.random() * 0.09,
    };
    return { move, done: false };
  }
}
