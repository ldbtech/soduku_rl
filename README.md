# overview

We are building a Reinforcement Learning agent that plays the Sudoku game in any format (any board size / symbols).

Goal: train an RL agent (starting with Q-learning) that learns to solve Sudoku boards step by step, with a Python environment for training and a React frontend to play and watch the agent.

What we have done so far:

- `envir/` — Python Sudoku environment (CLI-first, before moving to TypeScript):
  - `Sudoku` class with configurable `num_cols`, `num_rows`, `num_symbols`
  - `init_state()` — empty board as numpy array
  - `calculate_subgrid()` — auto subgrid shape for any board size
  - `validate_sudoku()` + `RuleEngine` (`rules.json`) — dimension check, value range, unique row / column / subgrid
  - `test.py` — 10 passing checks (valid board, empty board, row/column/subgrid duplicates, invalid symbols, wrong dimensions, non-integer board, rectangular board)
  - Still TODO: `rules()`, `fill_empty_cell()`, `steps()`, `reset()`, `action()` — the RL step/action/reward loop and Q-learning agent itself
- `frontend/` — React + TypeScript + Tailwind + Vite app:
  - Watch-only Sudoku board: the agent is the only player, humans pick the board size and spectate (no human input, agent auto-starts)
  - Placeholder policy: mock backend clicks random cells with random digits (`VITE_AGENT_MODE=random`, switch to `solver` for correct play)
  - Backend-ready API layer (`SudokuBackend` interface with mock + HTTP implementations) for the real RL policy later
  - Agent console (step, pause/resume, speed, move log), progress stats, timer, light/dark mode

# setup

Python environment:

```bash
cd envir
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
```

Frontend:

```bash
cd frontend
npm install
```

Optional: copy `frontend/.env.example` to `frontend/.env` to point at a real backend. By default it uses the mock backend.

# run instructions

Run everything with one command (creates `envir/venv` on first run, installs Python deps from `requirements.txt`, runs the Python environment, installs frontend deps if needed, then starts the frontend):

```bash
./run.sh
```

Then open http://localhost:5173 in a browser.

Run the Python environment directly:

```bash
cd envir
source venv/bin/activate
python main.py
```

Run the rule-engine checks:

```bash
cd envir
source venv/bin/activate
python test.py
```
