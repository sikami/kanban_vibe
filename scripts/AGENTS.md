# Scripts Notes

## Purpose

`scripts/` contains local start and stop helpers for macOS, Linux, and Windows. These scripts currently wrap Docker Compose so the scaffolding stack can be started and stopped consistently on each platform.

## Current files

- `start-mac.sh`
- `stop-mac.sh`
- `start-linux.sh`
- `stop-linux.sh`
- `start-windows.ps1`
- `stop-windows.ps1`
- `start-windows.bat`
- `stop-windows.bat`

## Working guidance

- Keep the scripts minimal and predictable.
- Prefer one shared app entrypoint through Docker Compose rather than duplicating environment logic per platform.
