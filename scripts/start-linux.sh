#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/scripts/run"

mkdir -p "$RUN_DIR"

docker compose -f "$ROOT_DIR/docker-compose.yml" up --build -d
docker compose -f "$ROOT_DIR/docker-compose.yml" ps > "$RUN_DIR/last-start.txt"

echo "App started at http://localhost:8000"
