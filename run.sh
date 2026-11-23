#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Install Python dependencies for the RL environment/agent.
if [ -f "$ROOT/envir/venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$ROOT/envir/venv/bin/activate"
fi
python3 -m pip install -r "$ROOT/requirements.txt"

# Run the frontend.
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

npm run dev -- "$@"
