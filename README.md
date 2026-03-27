# Project Management MVP

This repository contains a local-first Project Management MVP built around a Kanban board.

Current stack:
- Next.js frontend in `frontend/`
- FastAPI backend in `backend/`
- Docker-based local runtime
- SQLite persistence
- OpenRouter connectivity check

Current status:
- The frontend Kanban board is integrated and served by the FastAPI backend at `/`
- The app now requires login with the demo credentials `user` / `password`
- The board supports persisted renaming, adding columns, moving columns, deleting columns, adding cards, deleting cards, and drag-and-drop
- A health endpoint is available at `/api/health`
- The backend persists one board per user in SQLite
- The backend includes an authenticated OpenRouter connectivity check at `/api/ai/connectivity-check`

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

## AI connectivity check

After starting the app and logging in as `user` / `password`, you can verify OpenRouter connectivity with:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -c /tmp/pm-cookies.txt \
  -d '{"username":"user","password":"password"}'

curl -X POST http://localhost:8000/api/ai/connectivity-check \
  -b /tmp/pm-cookies.txt
```

The backend will send the prompt `2+2` to the configured model `openai/gpt-oss-120b`.

### Big Thanks
Ed Donner
