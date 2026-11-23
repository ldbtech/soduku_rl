# Sudoku Frontend

Modern Sudoku game built with **React + TypeScript + Tailwind CSS v4 + Vite**.

- User-controlled board size (presets + custom), validated through the backend API
- Puzzles, rules, and move validation come from the backend (mock included)
- Reinforcement-learning agent panel: watch the AI solve step by step (mock included)
- Reusable component library (`src/components/ui`, `src/components/sudoku`)
- Light / dark mode, keyboard + touch input, notes mode, hints, mistakes, timer

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 in a browser.

Other commands: `npm run build`, `npm run preview`, `npm run typecheck`.

## Backend contract

All backend access goes through the `SudokuBackend` interface in
[`src/api/backend.ts`](src/api/backend.ts). The app ships with two implementations:

| Implementation | File | When used |
|---|---|---|
| `MockSudokuBackend` | `src/api/mockBackend.ts` | default; simulates latency, generates real puzzles |
| `HttpSudokuBackend` | `src/api/httpBackend.ts` | when `VITE_API_URL` is set and `VITE_USE_MOCK=false` |

To point at a real backend, copy `.env.example` to `.env` and set:

```bash
VITE_API_URL=https://api.example.com
VITE_USE_MOCK=false
```

Expected REST endpoints (see `httpBackend.ts` for exact shapes):

- `POST /api/sudoku/validate-size` — `{ size }` → `{ valid, boxRows, boxCols, message? }`
- `GET /api/sudoku/rules?size=N` — board-size-aware rules + tips
- `POST /api/sudoku/puzzle` — `{ size, difficulty, seed? }` → `{ puzzle, solution }`
- `POST /api/sudoku/validate-move` — `{ puzzle, grid, row, col, value }` → `{ legal, conflictCells }`
- `POST /api/sudoku/hint` — `{ puzzle, grid }` → `{ row, col, value }`
- `POST /api/agent/next-move` — `{ puzzle, grid }` → `{ row, col, value, confidence? }`
- `GET /api/agent/solve-stream?session=…` (SSE, optional) — live RL move stream

Swap the mock for HTTP without touching any component: both implement the same
interface, selected by [`src/api/index.ts`](src/api/index.ts).

## Project structure

```text
src/
├── api/            # Backend interface + mock + HTTP implementations
├── components/
│   ├── ui/         # Reusable primitives: Button, Card, Dialog, SegmentedControl…
│   ├── sudoku/     # SudokuBoard, NumberPad, selectors, toolbar, agent panel…
│   └── layout/     # Header
├── hooks/          # useSudokuGame, useReinforcementAgent, useTheme
├── lib/            # Board math (lib/sudoku) + puzzle generator (lib/generator)
├── types/          # Shared TypeScript types
├── App.tsx         # App shell
└── index.css       # Tailwind theme + design tokens
```
