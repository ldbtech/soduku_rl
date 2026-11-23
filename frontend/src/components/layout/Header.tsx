import { Grid3x3, Moon, Plus, Sun } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button, IconButton } from "../ui/Button";

export interface HeaderProps {
  backendId: "mock" | "http";
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onNewGame: () => void;
}

/** Sticky app header: brand, backend badge, theme toggle, new-game action. */
export function Header({ backendId, theme, onToggleTheme, onNewGame }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-[12px] bg-blue-600 text-white dark:bg-blue-500"
          >
            <Grid3x3 className="size-5" />
          </span>
          <span className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-white">
            Sudoku
          </span>
          <Badge variant={backendId === "mock" ? "neutral" : "success"} className="hidden sm:inline-flex">
            {backendId === "mock" ? "Mock backend" : "Live backend"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <IconButton
            label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="size-5" aria-hidden />
            ) : (
              <Moon className="size-5" aria-hidden />
            )}
          </IconButton>
          <Button size="sm" onClick={onNewGame} icon={<Plus className="size-4" aria-hidden />}>
            <span className="hidden sm:inline">New game</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
