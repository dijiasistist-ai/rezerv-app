#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/dilekyildiz/Documents/Codex/2026-05-07/olleyy-com-un-ayn-s-n"
NODE_BIN="/opt/homebrew/bin/node"

cd "$PROJECT_DIR"
exec "$NODE_BIN" server.js
