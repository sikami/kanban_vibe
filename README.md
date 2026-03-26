# Project Management MVP

This repository contains a local-first Project Management MVP built around a Kanban board.

Current stack:
- Next.js frontend in `frontend/`
- FastAPI backend in `backend/`
- Docker-based local runtime
- SQLite planned for persistence
- OpenRouter planned for AI features

Current status:
- The frontend Kanban board is integrated and served by the FastAPI backend at `/`
- The app now requires login with the demo credentials `user` / `password`
- The board supports renaming columns, adding columns, moving columns, deleting columns, adding cards, deleting cards, and drag-and-drop
- A health endpoint is available at `/api/health`
- Persistence and AI features are planned but not implemented yet

## Project structure

- `AGENTS.md`
  Product requirements and working rules for the project
- `docs/PLAN.md`
  Execution plan and phased implementation checklist
- `frontend/`
  Next.js Kanban UI, frontend tests, and static export build
- `backend/`
  FastAPI app and backend tests
- `scripts/`
  Start and stop scripts for macOS, Linux, and Windows

## Run locally

From the project root:

```bash
./scripts/start-mac.sh
```

The app will be available at:

- `http://localhost:8000/`
- `http://localhost:8000/api/health`
- `http://localhost:8000/api/hello`

To stop it:

```bash
./scripts/stop-mac.sh
```

## Frontend checks

From `frontend/`:

```bash
NPM_CONFIG_CACHE=/tmp/pm-npm-cache npm ci
NPM_CONFIG_CACHE=/tmp/pm-npm-cache npm run test:unit
NPM_CONFIG_CACHE=/tmp/pm-npm-cache npm run build
NPM_CONFIG_CACHE=/tmp/pm-npm-cache npm run test:e2e
```

## Backend checks

From the project root:

```bash
uv run --project backend pytest backend/tests/test_app.py
```

If `uv` is not installed locally, see the backend setup in `backend/pyproject.toml` and use a local virtual environment.

### Big Thanks
Ed Donner
