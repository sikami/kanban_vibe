# Backend Notes

## Purpose

`backend/` contains the FastAPI service for the Project Management MVP. It currently serves the statically built frontend at `/`, exposes auth and health API routes, and will later add persistence and AI features.

## Current structure

- `app/main.py`
  FastAPI app entrypoint with static frontend serving plus health and demo-auth routes.
- `tests/test_app.py`
  Backend smoke tests for `/` and `/api/health`.
- `pyproject.toml`
  Backend dependency and test configuration.

## Working guidance

- Keep the backend simple and easy to reason about.
- Add narrow API routes with explicit request and response models.
- Prefer local, direct logic over abstraction until real duplication appears.
