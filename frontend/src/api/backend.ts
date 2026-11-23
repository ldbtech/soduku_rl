/**
 * Backend contract. Every network call the app makes flows through
 * `SudokuBackend`, so swapping the mock for the real service touches
 * exactly one file (`api/index.ts`) and zero components.
 */
import type {
  AgentMove,
  BoardSpec,
  CellPosition,
  Difficulty,
  Grid,
} from "../types/sudoku";

export class BackendError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}

// --- Board size validation -----------------------------------------------

export interface ValidateSizeRequest {
  size: number;
}

export interface ValidateSizeResponse {
  valid: boolean;
  size: number;
  boxRows: number;
  boxCols: number;
  message?: string;
  suggestions?: number[];
}

export function specFromValidation(res: ValidateSizeResponse): BoardSpec {
  return { size: res.size, boxRows: res.boxRows, boxCols: res.boxCols };
}

// --- Rules ----------------------------------------------------------------

export interface RulesResponse {
  size: number;
  title: string;
  rules: string[];
  tips: string[];
}

// --- Puzzles ---------------------------------------------------------------

export interface FetchPuzzleRequest {
  size: number;
  difficulty: Difficulty;
  seed?: number;
}

export interface FetchPuzzleResponse {
  puzzleId: string;
  size: number;
  boxRows: number;
  boxCols: number;
  difficulty: Difficulty;
  puzzle: Grid;
  /**
   * Full solution. The mock returns it; a strict production backend may
   * withhold it (return an empty grid) and validate moves server-side —
   * the app treats `solution` as optional.
   */
  solution: Grid;
}

// --- Move validation ---------------------------------------------------------

export interface ValidateMoveRequest {
  puzzleId?: string;
  size: number;
  grid: Grid;
  row: number;
  col: number;
  value: number;
}

export interface ValidateMoveResponse {
  /** Placement breaks no row/column/box rule. */
  legal: boolean;
  /** ...but is it the solution's digit? Unknown backends omit this. */
  correct?: boolean;
  conflicts: CellPosition[];
  completed: boolean;
  message?: string;
}

// --- Hints -------------------------------------------------------------------

export interface HintRequest {
  puzzleId?: string;
  size: number;
  grid: Grid;
}

export interface HintResponse extends CellPosition {
  value: number;
  explanation?: string;
}

// --- Reinforcement-learning agent ----------------------------------------------

export interface AgentMoveRequest {
  puzzleId?: string;
  size: number;
  grid: Grid;
  history?: AgentMove[];
}

export interface AgentMoveResponse {
  /** Null when the puzzle is complete — `done` is true instead. */
  move: AgentMove | null;
  done: boolean;
}

export interface SudokuBackend {
  readonly id: "mock" | "http";

  validateBoardSize(req: ValidateSizeRequest): Promise<ValidateSizeResponse>;
  fetchRules(size: number): Promise<RulesResponse>;
  fetchPuzzle(req: FetchPuzzleRequest): Promise<FetchPuzzleResponse>;
  validateMove(req: ValidateMoveRequest): Promise<ValidateMoveResponse>;
  requestHint(req: HintRequest): Promise<HintResponse>;
  requestAgentMove(req: AgentMoveRequest): Promise<AgentMoveResponse>;
}
