# Backend Notes

## Purpose

`backend/` contains the FastAPI service for the Project Management MVP. It currently serves the statically built frontend at `/` and exposes a health endpoint at `/api/health`. Later phases will add login, persistence, and AI features.

## Current structure

- `app/main.py`
  FastAPI app entrypoint with static frontend serving and the health route.
- `tests/test_app.py`
  Backend smoke tests for `/` and `/api/health`.
- `pyproject.toml`
  Backend dependency and test configuration.

## Working guidance

- Keep the backend simple and easy to reason about.
- Add narrow API routes with explicit request and response models.
- Prefer local, direct logic over abstraction until real duplication appears.
