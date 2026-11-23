#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Use the project Python environment (create it on first run).
if [ ! -f "$ROOT/envir/venv/bin/activate" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv "$ROOT/envir/venv"
fi
# shellcheck disable=SC1091
source "$ROOT/envir/venv/bin/activate"

# Install Python dependencies for the RL environment/agent.
python -m pip install -r "$ROOT/requirements.txt"

# Run the Python environment.
echo "Running Python environment..."
(cd "$ROOT/envir" && python main.py)

# Run the frontend.
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

npm run dev -- "$@"
