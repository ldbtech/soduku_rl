import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { getBackend } from "./api";
import { Badge } from "./components/ui/Badge";
import { Button, IconButton } from "./components/ui/Button";
import { Card, SectionTitle } from "./components/ui/Card";
import { Dialog } from "./components/ui/Dialog";
import { Skeleton } from "./components/ui/Stat";
import { Switch } from "./components/ui/Switch";
import { Header } from "./components/layout/Header";
import { AgentPanel } from "./components/sudoku/AgentPanel";
import { GameOverDialog } from "./components/sudoku/GameOverDialog";
import { GameStats } from "./components/sudoku/GameStats";
import { NewGameDialog } from "./components/sudoku/NewGameDialog";
import { RulesPanel } from "./components/sudoku/RulesPanel";
import { SudokuBoard } from "./components/sudoku/SudokuBoard";
import { useReinforcementAgent } from "./hooks/useReinforcementAgent";
import { useSudokuGame } from "./hooks/useSudokuGame";
import { useTheme } from "./hooks/useTheme";

const backend = getBackend();

export default function App() {
  const { theme, toggle } = useTheme();
  const game = useSudokuGame({ backend });
  const agent = useReinforcementAgent(game, backend);

  const [newGameOpen, setNewGameOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const [highlightRelated, setHighlightRelated] = useState(true);
  const [highlightSame, setHighlightSame] = useState(true);

  const {
    status,
    spec,
    grid,
    difficulty,
    error,
    clearError,
  } = game;

  // Open setup on first load; re-arm the game-over dialog per game.
  useEffect(() => {
    if (status === "idle") setNewGameOpen(true);
  }, [status]);
  useEffect(() => {
    if (status === "playing" || status === "loading") {
      setGameOverDismissed(false);
    }
  }, [status]);

  // The agent is the only player: every fresh board gets a new run id so
  // the autostart effect below picks it up exactly once.
  const [runId, setRunId] = useState(0);
  const autoStartedRun = useRef(-1);

  // Agent must stand down whenever the board is replaced or reset.
  const resetBoardAndAgent = () => {
    agent.resetAgent();
    game.reset();
    setRunId((id) => id + 1);
  };

  const startGame = async (size: number, diff: typeof difficulty) => {
    agent.resetAgent();
    setRunId((id) => id + 1);
    return game.newGame(size, diff);
  };

  // Humans only watch: as soon as a fresh board is playable, the agent
  // starts playing on its own. Manual pause/resume stays in the agent panel.
  useEffect(() => {
    if (
      game.status === "playing" &&
      runId !== autoStartedRun.current &&
      agent.agentStatus === "idle"
    ) {
      autoStartedRun.current = runId;
      agent.play();
    }
  });

  // Spectator keyboard controls: the agent plays, humans can only pause
  // the viewing and dismiss dialogs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (newGameOpen || settingsOpen) return;
      if (gameOverDismissed === false && (status === "won" || status === "lost")) {
        if (e.key === "Escape") setGameOverDismissed(true);
        return;
      }
      switch (e.key) {
        case "p":
        case "P":
          if (status === "playing") game.pause();
          else if (status === "paused") game.resume();
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [game, status, newGameOpen, settingsOpen, gameOverDismissed]);

  const outcome = status === "won" || status === "lost" ? status : null;
  const boardInteractive = status === "playing";
  const board =
    spec && grid && game.puzzle && game.notes
      ? { spec, grid, puzzle: game.puzzle, notes: game.notes }
      : null;

  return (
    <div className="min-h-full bg-[#f5f5f7] text-zinc-900 dark:bg-black dark:text-white">
      <Header
        backendId={backend.id}
        theme={theme}
        onToggleTheme={toggle}
        onNewGame={() => setNewGameOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-10 sm:px-6 sm:pt-7">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
          >
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
          {/* Board column */}
          <div className="min-w-0 space-y-4">
            <Card padding="sm" className="sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2 px-1 pt-1">
                <div className="flex items-center gap-2">
                  <SectionTitle>Board</SectionTitle>
                  <Badge variant="info">Agent plays</Badge>
                  {status === "paused" && <Badge variant="warning">Paused</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    label="Display settings"
                    onClick={() => setSettingsOpen(true)}
                    className="size-9"
                  >
                    <Settings2 className="size-[18px]" aria-hidden />
                  </IconButton>
                  {status === "playing" && (
                    <IconButton label="Pause game" onClick={game.pause} className="size-9">
                      <Pause className="size-[18px]" aria-hidden />
                    </IconButton>
                  )}
                  {status === "paused" && (
                    <IconButton label="Resume game" onClick={game.resume} className="size-9">
                      <Play className="size-[18px]" aria-hidden />
                    </IconButton>
                  )}
                  {(status === "playing" || status === "paused") && (
                    <IconButton label="Restart puzzle" onClick={resetBoardAndAgent} className="size-9">
                      <RotateCcw className="size-[18px]" aria-hidden />
                    </IconButton>
                  )}
                </div>
              </div>

              {status === "loading" || !board ? (
                <div className="space-y-4">
                  <Skeleton className="aspect-square w-full !rounded-2xl" />
                  <p className="pb-1 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {status === "loading"
                      ? "Validating size & generating puzzle…"
                      : "Choose a board to begin."}
                  </p>
                </div>
              ) : status === "paused" ? (
                <div className="relative">
                  <div className="pointer-events-none opacity-20 blur-[2px]" aria-hidden>
                    <SudokuBoard
                      spec={board.spec}
                      puzzle={board.puzzle}
                      grid={board.grid}
                      notes={board.notes}
                      selected={null}
                      conflicts={new Set()}
                      hintCell={null}
                      agentLastMove={null}
                      highlightRelated={false}
                      highlightSame={false}
                      interactive={false}
                      onSelect={() => {}}
                    />
                  </div>
                  <div className="absolute inset-0 grid place-items-center">
                    <Button onClick={game.resume} icon={<Play className="size-4" aria-hidden />}>
                      Resume
                    </Button>
                  </div>
                </div>
              ) : (
                <SudokuBoard
                  spec={board.spec}
                  puzzle={board.puzzle}
                  grid={board.grid}
                  notes={board.notes}
                  selected={game.selected}
                  conflicts={game.conflicts}
                  hintCell={game.hintCell}
                  agentLastMove={game.agentLastMove}
                  highlightRelated={highlightRelated}
                  highlightSame={highlightSame}
                  interactive={false}
                  onSelect={() => {}}
                />
              )}
            </Card>

            {board && (
              <p className="hidden text-center text-xs text-zinc-500 lg:block dark:text-zinc-400">
                The agent plays every move — sit back and watch · P pauses the viewing
              </p>
            )}
          </div>

          {/* Side column */}
          <div className="min-w-0 space-y-4">
            {board ? (
              <GameStats
                spec={board.spec}
                difficulty={difficulty}
                elapsed={game.elapsed}
                mistakes={game.mistakes}
                mistakesLimit={game.mistakesLimit}
                hintsUsed={game.hintsUsed}
                filledCount={game.filledCount}
                totalCount={game.totalCount}
              />
            ) : (
              <Card>
                <SectionTitle>Game</SectionTitle>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  No puzzle yet. Start a new game and watch the agent play it —
                  humans only spectate here.
                </p>
                <Button
                  size="sm"
                  variant="tonal"
                  className="mt-3"
                  onClick={() => setNewGameOpen(true)}
                >
                  Choose a board
                </Button>
              </Card>
            )}

            <AgentPanel
              agent={agent}
              backendId={backend.id}
              disabled={!board || !boardInteractive}
            />

            {spec && <RulesPanel backend={backend} size={spec.size} />}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-500">
          The agent plays every move — humans just watch · Puzzles and moves stream
          from the backend API
          {backend.id === "mock" ? " (simulated locally for now)" : ""} · {spec ? `${spec.size}×${spec.size}` : "no board"}
        </footer>
      </main>

      <NewGameDialog
        open={newGameOpen}
        backend={backend}
        starting={status === "loading"}
        onClose={() => setNewGameOpen(false)}
        onStart={startGame}
      />

      <GameOverDialog
        outcome={gameOverDismissed ? null : outcome}
        stats={{
          elapsed: game.elapsed,
          mistakes: game.mistakes,
          hintsUsed: game.hintsUsed,
          difficulty,
          size: spec?.size ?? 9,
        }}
        onViewBoard={() => setGameOverDismissed(true)}
        onRetry={() => {
          setGameOverDismissed(true);
          resetBoardAndAgent();
        }}
        onNewGame={() => {
          setGameOverDismissed(true);
          setNewGameOpen(true);
        }}
      />

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Display"
        description="Highlight helpers for the board."
      >
        <div className="space-y-4">
          <Switch
            label="Highlight related cells"
            description="Dim the row, column, and box of the selected cell."
            checked={highlightRelated}
            onChange={setHighlightRelated}
          />
          <Switch
            label="Highlight same digits"
            description="Tint every cell holding the selected digit."
            checked={highlightSame}
            onChange={setHighlightSame}
          />
        </div>
      </Dialog>
    </div>
  );
}
