import { Eraser, Lightbulb, Pencil, Undo2 } from "lucide-react";
import { cn } from "../ui/cn";

export interface GameToolbarProps {
  notesMode: boolean;
  canUndo: boolean;
  hintLoading: boolean;
  disabled: boolean;
  onToggleNotes: () => void;
  onErase: () => void;
  onUndo: () => void;
  onHint: () => void;
}

/** Undo / erase / notes / hint action bar with icon + label actions. */
export function GameToolbar({
  notesMode,
  canUndo,
  hintLoading,
  disabled,
  onToggleNotes,
  onErase,
  onUndo,
  onHint,
}: GameToolbarProps) {
  const actions = [
    {
      key: "undo",
      label: "Undo",
      icon: <Undo2 className="size-5" aria-hidden />,
      onClick: onUndo,
      active: false,
      enabled: canUndo && !disabled,
    },
    {
      key: "erase",
      label: "Erase",
      icon: <Eraser className="size-5" aria-hidden />,
      onClick: onErase,
      active: false,
      enabled: !disabled,
    },
    {
      key: "notes",
      label: notesMode ? "Notes on" : "Notes",
      icon: <Pencil className="size-5" aria-hidden />,
      onClick: onToggleNotes,
      active: notesMode,
      enabled: !disabled,
    },
    {
      key: "hint",
      label: hintLoading ? "…" : "Hint",
      icon: (
        <Lightbulb
          className={cn("size-5", hintLoading && "animate-pulse")}
          aria-hidden
        />
      ),
      onClick: onHint,
      active: false,
      enabled: !disabled && !hintLoading,
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Game actions"
      className="grid grid-cols-4 gap-1"
    >
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={!action.enabled}
          onClick={action.onClick}
          aria-pressed={action.key === "notes" ? notesMode : undefined}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-colors duration-150 outline-none",
            "focus-visible:ring-2 focus-visible:ring-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-35",
            action.active
              ? "bg-blue-600/12 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
              : "text-zinc-600 hover:bg-black/[0.05] active:bg-black/10 dark:text-zinc-300 dark:hover:bg-white/10",
          )}
        >
          {action.icon}
          <span className="text-[11px] leading-none font-semibold">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
