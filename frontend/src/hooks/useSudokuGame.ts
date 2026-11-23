import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SudokuBackend } from "../api/backend";
import { BackendError, specFromValidation } from "../api/backend";
import type {
  AgentMove,
  BoardSpec,
  CellPosition,
  Difficulty,
  GameStatus,
  Grid,
  NotesGrid,
} from "../types/sudoku";
import { cellKey } from "../types/sudoku";
import {
  cloneGrid,
  countFilled,
  findConflicts,
  isComplete,
} from "../lib/sudoku";

export const DEFAULT_MISTAKES_LIMIT = 3;
const HISTORY_LIMIT = 300;
const MULTI_DIGIT_WINDOW_MS = 650;

interface Snapshot {
  grid: Grid;
  notes: NotesGrid;
  mistakes: number;
}

function createEmptyNotes(size: number): NotesGrid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => [] as number[]),
  );
}

function cloneNotes(notes: NotesGrid): NotesGrid {
  return notes.map((row) => row.map((cell) => [...cell]));
}

export interface SudokuGame {
  status: GameStatus;
  spec: BoardSpec | null;
  difficulty: Difficulty;
  puzzleId: string | null;
  puzzle: Grid | null;
  grid: Grid | null;
  notes: NotesGrid | null;
  selected: CellPosition | null;
  notesMode: boolean;
  mistakes: number;
  mistakesLimit: number;
  hintsUsed: number;
  hintLoading: boolean;
  conflicts: Set<string>;
  hintCell: CellPosition | null;
  agentLastMove: AgentMove | null;
  elapsed: number;
  error: string | null;
  filledCount: number;
  totalCount: number;
  canUndo: boolean;

  newGame: (size: number, difficulty: Difficulty) => Promise<boolean>;
  selectCell: (pos: CellPosition | null) => void;
  moveSelection: (dRow: number, dCol: number) => void;
  inputValue: (value: number) => void;
  inputDigit: (digit: string) => void;
  toggleNotesMode: () => void;
  erase: () => void;
  undo: () => void;
  hint: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  applyExternalMove: (move: AgentMove) => void;
  clearError: () => void;
  isGiven: (row: number, col: number) => boolean;
}

interface UseSudokuGameOptions {
  backend: SudokuBackend;
  mistakesLimit?: number;
}

function messageOf(err: unknown): string {
  if (err instanceof BackendError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function useSudokuGame(options: UseSudokuGameOptions): SudokuGame {
  const { backend, mistakesLimit = DEFAULT_MISTAKES_LIMIT } = options;

  const [status, setStatus] = useState<GameStatus>("idle");
  const [spec, setSpec] = useState<BoardSpec | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<Grid | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [notes, setNotes] = useState<NotesGrid | null>(null);
  const [selected, setSelected] = useState<CellPosition | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [hintCell, setHintCell] = useState<CellPosition | null>(null);
  const [agentLastMove, setAgentLastMove] = useState<AgentMove | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);

  /** Always-latest grid for async fallbacks that outlive their closure. */
  const gridRef = useRef<Grid | null>(null);
  gridRef.current = grid;

  /** Monotonic game id — drops async responses from superseded games. */
  const gameSeq = useRef(0);
  /** Monotonic move-validation id — drops stale validation responses. */
  const validationSeq = useRef(0);
  const digitBuffer = useRef("");
  const digitTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (digitTimer.current !== null) {
        window.clearTimeout(digitTimer.current);
      }
    };
  }, []);

  // Timer ticks only while actively playing.
  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const pushHistory = useCallback((snap: Snapshot) => {
    setHistory((h) => {
      const next = [...h, snap];
      return next.length > HISTORY_LIMIT
        ? next.slice(next.length - HISTORY_LIMIT)
        : next;
    });
  }, []);

  const newGame = useCallback(
    async (size: number, nextDifficulty: Difficulty): Promise<boolean> => {
      const seq = (gameSeq.current += 1);
      digitBuffer.current = "";
      setStatus("loading");
      setError(null);
      setSelected(null);
      setHintCell(null);
      setAgentLastMove(null);
      try {
        const validation = await backend.validateBoardSize({ size });
        if (seq !== gameSeq.current) return false;
        if (!validation.valid) {
          setStatus(spec ? "playing" : "idle");
          setError(validation.message ?? `Board size ${size} was rejected.`);
          return false;
        }
        const nextSpec = specFromValidation(validation);
        const res = await backend.fetchPuzzle({
          size: nextSpec.size,
          difficulty: nextDifficulty,
        });
        if (seq !== gameSeq.current) return false;
        setSpec(nextSpec);
        setDifficulty(nextDifficulty);
        setPuzzleId(res.puzzleId);
        setPuzzle(res.puzzle);
        setGrid(cloneGrid(res.puzzle));
        setNotes(createEmptyNotes(nextSpec.size));
        setMistakes(0);
        setHintsUsed(0);
        setConflicts(new Set());
        setElapsed(0);
        setHistory([]);
        setNotesMode(false);
        setStatus("playing");
        return true;
      } catch (err) {
        if (seq !== gameSeq.current) return false;
        setStatus(spec ? "playing" : "idle");
        setError(messageOf(err));
        return false;
      }
    },
    [backend, spec],
  );

  const selectCell = useCallback(
    (pos: CellPosition | null) => {
      if (status !== "playing" && status !== "paused") return;
      setSelected(pos);
    },
    [status],
  );

  const moveSelection = useCallback(
    (dRow: number, dCol: number) => {
      if (!spec || (status !== "playing" && status !== "paused")) return;
      setSelected((prev) => {
        const row = prev ? prev.row + dRow : 0;
        const col = prev ? prev.col + dCol : 0;
        return {
          row: Math.min(spec.size - 1, Math.max(0, row)),
          col: Math.min(spec.size - 1, Math.max(0, col)),
        };
      });
    },
    [spec, status],
  );

  const commitValue = useCallback(
    (value: number) => {
      if (
        status !== "playing" ||
        !spec ||
        !grid ||
        !notes ||
        !selected ||
        !puzzle ||
        value < 1 ||
        value > spec.size
      ) {
        return;
      }
      const { row, col } = selected;
      if (puzzle[row][col] !== 0) return;

      pushHistory({ grid: cloneGrid(grid), notes: cloneNotes(notes), mistakes });

      if (notesMode) {
        if (grid[row][col] !== 0) return;
        setNotes((prev) => {
          if (!prev) return prev;
          const next = cloneNotes(prev);
          const cell = next[row][col];
          const idx = cell.indexOf(value);
          if (idx >= 0) cell.splice(idx, 1);
          else cell.push(value);
          cell.sort((a, b) => a - b);
          return next;
        });
        return;
      }

      if (grid[row][col] === value) return;
      const before = cloneGrid(grid);
      setGrid((prev) => {
        if (!prev) return prev;
        const next = cloneGrid(prev);
        next[row][col] = value;
        return next;
      });
      setNotes((prev) => {
        if (!prev) return prev;
        const next = cloneNotes(prev);
        next[row][col] = [];
        return next;
      });
      setHintCell(null);

      // Authoritative grading happens server-side; apply when it resolves.
      const seq = (validationSeq.current += 1);
      const game = gameSeq.current;
      const id = puzzleId;
      void backend
        .validateMove({ puzzleId: id ?? undefined, size: spec.size, grid: before, row, col, value })
        .then((res) => {
          if (game !== gameSeq.current) return;
          // Every entry is graded exactly once, even if superseded.
          if (res.correct === false) {
            setMistakes((m) => {
              const nextMistakes = m + 1;
              if (nextMistakes >= mistakesLimit) {
                setStatus((s) => (s === "playing" ? "lost" : s));
              }
              return nextMistakes;
            });
          }
          // Board-wide state only follows the latest validation.
          if (seq !== validationSeq.current) return;
          setConflicts(new Set(res.conflicts.map(cellKey)));
          if (res.completed) setStatus((s) => (s === "playing" ? "won" : s));
        })
        .catch(() => {
          // Offline blip: fall back to local rule check for conflicts only.
          if (seq !== validationSeq.current || game !== gameSeq.current) return;
          const current = gridRef.current;
          if (current) setConflicts(findConflicts(current, spec));
        });
    },
    [status, spec, grid, notes, selected, puzzle, mistakes, notesMode, pushHistory, backend, puzzleId, mistakesLimit],
  );

  /** Digit-key entry with multi-digit support for boards larger than 9. */
  const inputDigit = useCallback(
    (digit: string) => {
      if (!spec || status !== "playing") return;
      if (spec.size <= 9) {
        const value = Number(digit);
        if (value >= 1 && value <= spec.size) commitValue(value);
        return;
      }
      const buffer = digitBuffer.current + digit;
      if (Number(buffer) > spec.size || buffer.length > 2) {
        digitBuffer.current = digit;
      } else {
        digitBuffer.current = buffer;
      }
      if (digitTimer.current !== null) window.clearTimeout(digitTimer.current);
      // Commit immediately when no longer ambiguous, else wait for more digits.
      if (Number(digitBuffer.current) * 10 > spec.size) {
        const value = Number(digitBuffer.current);
        digitBuffer.current = "";
        commitValue(value);
      } else {
        digitTimer.current = window.setTimeout(() => {
          const value = Number(digitBuffer.current);
          digitBuffer.current = "";
          if (value >= 1 && value <= (spec?.size ?? 0)) commitValue(value);
        }, MULTI_DIGIT_WINDOW_MS);
      }
    },
    [spec, status, commitValue],
  );

  const inputValue = useCallback(
    (value: number) => {
      digitBuffer.current = "";
      commitValue(value);
    },
    [commitValue],
  );

  const toggleNotesMode = useCallback(() => {
    if (status !== "playing") return;
    setNotesMode((n) => !n);
  }, [status]);

  const erase = useCallback(() => {
    if (status !== "playing" || !grid || !notes || !selected || !puzzle || !spec) {
      return;
    }
    const { row, col } = selected;
    if (puzzle[row][col] !== 0) return;
    if (grid[row][col] === 0 && notes[row][col].length === 0) return;
    pushHistory({ grid: cloneGrid(grid), notes: cloneNotes(notes), mistakes });
    const next = cloneGrid(grid);
    next[row][col] = 0;
    setGrid(next);
    setNotes((prev) => {
      if (!prev) return prev;
      const n = cloneNotes(prev);
      n[row][col] = [];
      return n;
    });
    setHintCell(null);
    validationSeq.current += 1;
    setConflicts(findConflicts(next, spec));
  }, [status, grid, notes, selected, puzzle, spec, mistakes, pushHistory]);

  const undo = useCallback(() => {
    if (status !== "playing" || history.length === 0 || !spec) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGrid(cloneGrid(last.grid));
    setNotes(cloneNotes(last.notes));
    setMistakes(last.mistakes);
    setHintCell(null);
    setConflicts(findConflicts(last.grid, spec));
    validationSeq.current += 1;
  }, [status, history, spec]);

  const hint = useCallback(async () => {
    if (status !== "playing" || !spec || !grid || !notes || hintLoading) return;
    setHintLoading(true);
    setError(null);
    const game = gameSeq.current;
    try {
      const res = await backend.requestHint({
        puzzleId: puzzleId ?? undefined,
        size: spec.size,
        grid: cloneGrid(grid),
      });
      if (game !== gameSeq.current) return;
      pushHistory({ grid: cloneGrid(grid), notes: cloneNotes(notes), mistakes });
      const next = cloneGrid(grid);
      next[res.row][res.col] = res.value;
      setGrid(next);
      setNotes((prev) => {
        if (!prev) return prev;
        const n = cloneNotes(prev);
        n[res.row][res.col] = [];
        return n;
      });
      setSelected({ row: res.row, col: res.col });
      setHintCell({ row: res.row, col: res.col });
      setHintsUsed((h) => h + 1);
      const nextConflicts = findConflicts(next, spec);
      setConflicts(nextConflicts);
      if (isComplete(next) && nextConflicts.size === 0) {
        setStatus("won");
      }
    } catch (err) {
      if (game !== gameSeq.current) return;
      setError(messageOf(err));
    } finally {
      if (game === gameSeq.current) setHintLoading(false);
    }
  }, [status, spec, grid, notes, hintLoading, backend, puzzleId, mistakes, pushHistory]);

  const pause = useCallback(() => {
    setStatus((s) => (s === "playing" ? "paused" : s));
  }, []);

  const resume = useCallback(() => {
    setStatus((s) => (s === "paused" ? "playing" : s));
  }, []);

  const reset = useCallback(() => {
    if (!spec || !puzzle) return;
    gameSeq.current += 1;
    validationSeq.current += 1;
    digitBuffer.current = "";
    setGrid(cloneGrid(puzzle));
    setNotes(createEmptyNotes(spec.size));
    setSelected(null);
    setMistakes(0);
    setHintsUsed(0);
    setConflicts(new Set());
    setHintCell(null);
    setAgentLastMove(null);
    setElapsed(0);
    setHistory([]);
    setError(null);
    setStatus("playing");
  }, [spec, puzzle]);

  /** Applies a move from the hint system or the RL agent. */
  const applyExternalMove = useCallback(
    (move: AgentMove) => {
      if (status !== "playing" || !spec || !grid || !notes || !puzzle) return;
      if (puzzle[move.row][move.col] !== 0) return;
      pushHistory({ grid: cloneGrid(grid), notes: cloneNotes(notes), mistakes });
      const next = cloneGrid(grid);
      next[move.row][move.col] = move.value;
      setGrid(next);
      setNotes((prev) => {
        if (!prev) return prev;
        const n = cloneNotes(prev);
        n[move.row][move.col] = [];
        return n;
      });
      setSelected({ row: move.row, col: move.col });
      setAgentLastMove(move);
      const nextConflicts = findConflicts(next, spec);
      setConflicts(nextConflicts);
      if (isComplete(next) && nextConflicts.size === 0) {
        setStatus("won");
      }
    },
    [status, spec, grid, notes, puzzle, mistakes, pushHistory],
  );

  const clearError = useCallback(() => setError(null), []);

  const isGiven = useCallback(
    (row: number, col: number) => (puzzle ? puzzle[row][col] !== 0 : false),
    [puzzle],
  );

  const { filledCount, totalCount } = useMemo(() => {
    if (!grid || !spec) return { filledCount: 0, totalCount: 0 };
    return { filledCount: countFilled(grid), totalCount: spec.size * spec.size };
  }, [grid, spec]);

  return {
    status,
    spec,
    difficulty,
    puzzleId,
    puzzle,
    grid,
    notes,
    selected,
    notesMode,
    mistakes,
    mistakesLimit,
    hintsUsed,
    hintLoading,
    conflicts,
    hintCell,
    agentLastMove,
    elapsed,
    error,
    filledCount,
    totalCount,
    canUndo: history.length > 0 && status === "playing",
    newGame,
    selectCell,
    moveSelection,
    inputValue,
    inputDigit,
    toggleNotesMode,
    erase,
    undo,
    hint,
    pause,
    resume,
    reset,
    applyExternalMove,
    clearError,
    isGiven,
  };
}
