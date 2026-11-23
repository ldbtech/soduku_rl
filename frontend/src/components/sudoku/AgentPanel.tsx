import { Bot, Pause, Play, StepForward } from "lucide-react";
import type { AgentStatus } from "../../types/sudoku";
import { formatConfidence } from "../../lib/format";
import type { ReinforcementAgent } from "../../hooks/useReinforcementAgent";
import {
  MAX_AGENT_SPEED,
  MIN_AGENT_SPEED,
} from "../../hooks/useReinforcementAgent";
import { Badge, type BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, SectionTitle } from "../ui/Card";
import { Slider } from "../ui/Slider";

export interface AgentPanelProps {
  agent: ReinforcementAgent;
  backendId: "mock" | "http";
  disabled: boolean;
}

const STATUS_BADGE: Record<AgentStatus, { variant: BadgeVariant; label: string; pulse: boolean }> = {
  idle: { variant: "neutral", label: "Idle", pulse: false },
  thinking: { variant: "info", label: "Thinking", pulse: true },
  playing: { variant: "info", label: "Playing", pulse: true },
  paused: { variant: "warning", label: "Paused", pulse: false },
  done: { variant: "success", label: "Done", pulse: false },
  error: { variant: "danger", label: "Error", pulse: false },
};

/**
 * Reinforcement-learning agent console. Every move is requested from the
 * backend policy — this panel only renders and paces them.
 */
export function AgentPanel({ agent, backendId, disabled }: AgentPanelProps) {
  const { agentStatus, speed, log, error } = agent;
  const badge = STATUS_BADGE[agentStatus];
  const last = log.length > 0 ? log[log.length - 1] : null;
  const canStep = !disabled && (agentStatus === "idle" || agentStatus === "paused");
  const canPlay = !disabled && (agentStatus === "idle" || agentStatus === "paused");
  const canPause = agentStatus === "playing" || agentStatus === "thinking";

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Bot className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <SectionTitle>AI solver</SectionTitle>
        </span>
        <span className="flex gap-1.5">
          <Badge variant={backendId === "mock" ? "neutral" : "success"}>
            {backendId === "mock" ? "Simulated policy" : "Live policy"}
          </Badge>
          <Badge variant={badge.variant} dot={badge.pulse}>
            {badge.label}
          </Badge>
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
        A reinforcement-learning policy on the backend picks each move. Step
        through it, or press play and watch.
      </p>

      {disabled ? (
        <p className="mt-3 rounded-2xl bg-black/[0.04] px-3 py-2.5 text-center text-[13px] font-medium text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">
          Start a game to watch the agent solve it.
        </p>
      ) : (
        <>
          <div className="mt-3 flex gap-2">
            <Button
              variant="tonal"
              size="sm"
              disabled={!canStep}
              onClick={() => void agent.stepOnce()}
              icon={<StepForward className="size-4" aria-hidden />}
              className="flex-1"
            >
              Step
            </Button>
            {canPause ? (
              <Button
                size="sm"
                onClick={agent.pause}
                icon={<Pause className="size-4" aria-hidden />}
                className="flex-1"
              >
                Pause
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!canPlay}
                onClick={agent.play}
                icon={<Play className="size-4" aria-hidden />}
                className="flex-1"
              >
                {agentStatus === "paused" ? "Resume" : "Auto-play"}
              </Button>
            )}
          </div>

          <div className="mt-3">
            <Slider
              label="Playback speed"
              value={speed}
              min={MIN_AGENT_SPEED}
              max={MAX_AGENT_SPEED}
              step={0.5}
              onChange={agent.setSpeed}
              format={(v) => `${v} moves/s`}
            />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {last && (
        <p className="mt-2 text-[13px] text-zinc-600 tabular-nums dark:text-zinc-300">
          Last move{" "}
          <strong className="font-bold text-zinc-900 dark:text-white">
            R{last.row + 1} C{last.col + 1} → {last.value}
          </strong>
          {last.confidence !== undefined && (
            <span className="text-zinc-500 dark:text-zinc-400">
              {" "}· {formatConfidence(last.confidence)} confidence
            </span>
          )}
        </p>
      )}

      {log.length > 0 && (
        <ol
          aria-label="Agent move log"
          className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-2xl bg-black/[0.03] p-2 dark:bg-white/[0.05]"
        >
          {[...log].reverse().map((move, i) => (
            <li
              key={log.length - i}
              className="flex items-center justify-between px-2 text-xs tabular-nums text-zinc-600 dark:text-zinc-300"
            >
              <span>
                <span className="mr-2 font-bold text-zinc-400 dark:text-zinc-500">
                  {log.length - i}
                </span>
                R{move.row + 1} C{move.col + 1} → {move.value}
              </span>
              {move.confidence !== undefined && (
                <span className="font-medium text-zinc-400 dark:text-zinc-500">
                  {formatConfidence(move.confidence)}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
