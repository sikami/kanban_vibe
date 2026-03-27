# Database design for Project Management MVP

This document covers Part 5 of the execution plan: the SQLite persistence design for the MVP.

## Goals

- Support the current MVP login flow with one hardcoded user exposed in the UI.
- Keep the schema ready for future multi-user expansion.
- Store one Kanban board per user with minimal relational complexity.
- Preserve the existing frontend board shape so Part 7 can connect with low risk.

## Recommended approach

Use two SQLite tables:

1. `users`
2. `boards`

The authenticated app user remains the existing hardcoded login:

- username: `user`
- password: `password`

For the MVP, that user should also be inserted into the database automatically during initialization so the persistence layer has a stable row to reference.

## Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  board_json TEXT NOT NULL,
  board_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Why this is the right level of simplicity

- The app only needs one board per user, so `boards.user_id` should be `UNIQUE`.
- The frontend already works with one complete board object, so storing the full board as JSON avoids premature normalization.
- SQLite can handle this MVP cleanly without introducing an ORM or migration framework unless we later decide it is worth the overhead.

## Board JSON contract

The stored JSON should match the current frontend board shape:

```json
{
  "columns": [
    {
      "id": "col-backlog",
      "title": "Backlog",
      "cardIds": ["card-1", "card-2"]
    }
  ],
  "cards": {
    "card-1": {
      "id": "card-1",
      "title": "Align roadmap themes",
      "details": "Draft quarterly themes with impact statements and metrics."
    }
  }
}
```

Required rules:

- `columns` is an ordered array.
- `cards` is a map keyed by card id.
- Every id in `column.cardIds` must exist in `cards`.
- Every card should appear in exactly one column.

## Versioning

Use a simple integer `board_version` column on the `boards` table.

For the MVP:

- Start every saved board at version `1`.
- Treat `board_version` as the schema version of `board_json`, not as a revision history counter.
- Reject or migrate unsupported versions in backend validation once persistence is implemented.

This keeps future schema changes possible without complicating the current implementation.

## Initialization behavior

On backend startup:

1. Create the SQLite database file if it does not exist.
2. Create the `users` and `boards` tables if they do not exist.
3. Insert the demo user if missing.
4. Insert that user's default board if missing, using the existing frontend initial board data.

This ensures the app can start from an empty local environment with no manual setup.

## File location

Recommended database path:

- `backend/data/pm.db`

Recommended behavior:

- Create the `backend/data/` directory automatically if it does not exist.
- Keep the path configurable later, but hardcode the MVP default first.

## Migration expectations

For the MVP, avoid a full migration tool.

Use a small startup initializer that:

- creates missing tables
- seeds missing required rows
- checks the supported `board_version`

If the schema changes later, we can add a lightweight migration step or adopt a formal migration tool then.

## API implications for later parts

Part 6 should expose:

- `GET /api/board`
- `PUT /api/board`

Expected behavior:

- Both routes require authentication.
- `GET` returns the authenticated user's board JSON.
- `PUT` replaces the authenticated user's board JSON after validation.
- The backend updates `updated_at` whenever the board changes.

## Out of scope for the MVP

- Multiple boards per user
- Separate normalized `columns` and `cards` tables
- Password hashing
- Board revision history
- Conflict resolution for concurrent edits

## Approval request

Recommended Part 5 sign-off decision:

- Proceed with a two-table SQLite design: `users` plus `boards`
- Store the entire board in `boards.board_json`
- Version the JSON shape with `boards.board_version`
- Auto-seed the demo user and default board on first startup
