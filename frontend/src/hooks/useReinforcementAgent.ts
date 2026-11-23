import { useCallback, useEffect, useRef, useState } from "react";
import type { SudokuBackend } from "../api/backend";
import { messageOfGameError } from "./gameErrors";
import type { AgentMove, AgentStatus } from "../types/sudoku";
import type { SudokuGame } from "./useSudokuGame";

export const MIN_AGENT_SPEED = 0.5;
export const MAX_AGENT_SPEED = 10;
export const DEFAULT_AGENT_SPEED = 2;
const LOG_LIMIT = 100;

export interface ReinforcementAgent {
  agentStatus: AgentStatus;
  speed: number;
  log: AgentMove[];
  error: string | null;
  setSpeed: (movesPerSecond: number) => void;
  stepOnce: () => Promise<void>;
  play: () => void;
  pause: () => void;
  resetAgent: () => void;
  clearError: () => void;
}

/**
 * Drives the backend RL policy move-by-move. The frontend never solves:
 * every move comes from `backend.requestAgentMove`, so swapping in the real
 * RL service changes nothing here.
 */
export function useReinforcementAgent(
  game: SudokuGame,
  backend: SudokuBackend,
): ReinforcementAgent {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [speed, setSpeedState] = useState(DEFAULT_AGENT_SPEED);
  const [log, setLog] = useState<AgentMove[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Always-latest handles so the autoplay loop never goes stale. */
  const gameRef = useRef(game);
  gameRef.current = game;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const playingRef = useRef(false);
  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(stopTimer, [stopTimer]);

  const setSpeed = useCallback((movesPerSecond: number) => {
    const clamped = Math.min(
      MAX_AGENT_SPEED,
      Math.max(MIN_AGENT_SPEED, movesPerSecond),
    );
    setSpeedState(clamped);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const finishIfSettled = useCallback((): boolean => {
    const g = gameRef.current;
    if (g.status === "won" || g.status === "lost") {
      playingRef.current = false;
      stopTimer();
      setAgentStatus("done");
      return true;
    }
    return false;
  }, [stopTimer]);

  const stepOnce = useCallback(async (): Promise<void> => {
    const g = gameRef.current;
    if (busyRef.current || !g.spec || !g.grid) return;
    if (g.status !== "playing") return;
    busyRef.current = true;
    setAgentStatus((s) => (s === "playing" ? s : "thinking"));
    setError(null);
    try {
      const res = await backend.requestAgentMove({
        puzzleId: g.puzzleId ?? undefined,
        size: g.spec.size,
        grid: g.grid.map((row) => [...row]),
      });
      const latest = gameRef.current;
      if (latest.status !== "playing") {
        setAgentStatus((s) => (s === "playing" ? "paused" : s));
        return;
      }
      if (res.done || !res.move) {
        playingRef.current = false;
        stopTimer();
        setAgentStatus("done");
        return;
      }
      latest.applyExternalMove(res.move);
      setLog((prev) => {
        const next = [...prev, res.move as AgentMove];
        return next.length > LOG_LIMIT
          ? next.slice(next.length - LOG_LIMIT)
          : next;
      });
      finishIfSettled();
    } catch (err) {
      playingRef.current = false;
      stopTimer();
      setError(messageOfGameError(err));
      setAgentStatus("error");
    } finally {
      busyRef.current = false;
      setAgentStatus((s) => {
        if (s === "thinking") return playingRef.current ? "playing" : "idle";
        return s;
      });
    }
  }, [backend, finishIfSettled, stopTimer]);

  const stepRef = useRef(stepOnce);
  stepRef.current = stepOnce;

  const tick = useCallback(() => {
    timerRef.current = null;
    if (!playingRef.current) return;
    if (finishIfSettled()) return;
    const g = gameRef.current;
    if (g.status !== "playing") {
      playingRef.current = false;
      setAgentStatus("paused");
      return;
    }
    void stepRef.current().finally(() => {
      if (!playingRef.current || finishIfSettled()) return;
      const delay = Math.round(1000 / speedRef.current);
      timerRef.current = window.setTimeout(tick, delay);
    });
  }, [finishIfSettled]);

  const play = useCallback(() => {
    const g = gameRef.current;
    if (!g.spec || !g.grid || g.status !== "playing") return;
    if (playingRef.current) return;
    playingRef.current = true;
    setError(null);
    setAgentStatus("playing");
    tick();
  }, [tick]);

  const pause = useCallback(() => {
    playingRef.current = false;
    stopTimer();
    setAgentStatus((s) =>
      s === "playing" || s === "thinking" ? "paused" : s,
    );
  }, [stopTimer]);

  // If the game settles or pauses underneath the agent, stand down.
  useEffect(() => {
    if (!playingRef.current) return;
    if (game.status === "won" || game.status === "lost") {
      playingRef.current = false;
      stopTimer();
      setAgentStatus("done");
    } else if (game.status !== "playing") {
      playingRef.current = false;
      stopTimer();
      setAgentStatus("paused");
    }
  }, [game.status, stopTimer]);

  const resetAgent = useCallback(() => {
    playingRef.current = false;
    stopTimer();
    setLog([]);
    setError(null);
    setAgentStatus("idle");
  }, [stopTimer]);

  return {
    agentStatus,
    speed,
    log,
    error,
    setSpeed,
    stepOnce,
    play,
    pause,
    resetAgent,
    clearError,
  };
}
