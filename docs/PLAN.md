# High level steps for project

This plan is the execution checklist for the Project Management MVP in [AGENTS.md](/Users/listya/Documents/Belajar/agentic/pm/pm/AGENTS.md). It should stay practical, minimal, and implementation-focused.

Assumptions clarified with the user:
- `/Users/listya/Documents/Belajar/agentic/pm/pm` is the project root.
- The MVP needs both an `Add column` control that creates a new column and an `Add card` action inside a column that creates a new card.
- Columns are also expected to be deletable.
- Columns are also expected to be movable within the board.
- After plan approval, execution should continue through later phases rather than stopping after docs.

Current state:
- `frontend/` is integrated into the Docker-served FastAPI app as a static build.
- The board is still fully client-side and uses in-memory state after login.
- The app now includes a working fake login/logout flow for the hardcoded user.
- Unit, component, backend, and Playwright coverage exist for the current scaffold, login flow, and core board interactions.
- Persistence and AI integration are not implemented yet.
- One business-rule gap still open: the current column rename behavior updates live on each keystroke, but the requirement says clicking outside while editing should discard unsaved changes and revert to the previous title.

## Next actionable steps

1. Complete Part 5 sign-off using [`docs/DATABASE.md`](/Users/listya/Documents/Belajar/agentic/pm/pm/docs/DATABASE.md).
2. Build Part 6 backend persistence: SQLite init, demo-user seed, and authenticated board read/write APIs.
3. Build Part 7 frontend persistence: load board from API, save board mutations, and fix rename-to-revert-on-outside-click behavior.
4. Verify persistence with backend tests, frontend tests, and reload-based end-to-end coverage.
5. Build Part 8 connectivity to OpenRouter with `OPENROUTER_API_KEY` and `openai/gpt-oss-120b`.
6. Build Part 9 structured AI request/response handling with validated optional board updates.
7. Build Part 10 sidebar chat UI and automatic board refresh after AI-applied changes.

## Part 1: Plan

Goal: produce an approved execution plan and accurate project documentation before implementation.

Checklist:
- [x] Review `AGENTS.md`, `docs/PLAN.md`, and the existing `frontend/` codebase.
- [x] Expand this plan into detailed implementation steps with explicit tests and success criteria.
- [x] Document the current frontend structure and behavior in `frontend/AGENTS.md`.
- [x] Capture known gaps between the current frontend demo and the business requirements.
- [x] Pause for user review and approval before implementation.

Tests:
- Manual review that the plan covers all MVP requirements from `AGENTS.md`.
- Manual review that `frontend/AGENTS.md` matches the actual files and behaviors in `frontend/`.

Success criteria:
- The plan is detailed enough that each later part can be executed without re-scoping the project.
- The user reviews and approves the plan before implementation begins.

## Part 2: Scaffolding

Goal: establish the containerized app structure, backend skeleton, and local run scripts, with proof that FastAPI can serve both `/` and an API endpoint.

Checklist:
- [x] Create a backend app in `backend/` using FastAPI and `uv`.
- [x] Add a minimal dependency/config setup for backend development and Docker builds.
- [x] Add Docker assets needed to build and run the combined application locally.
- [x] Add start/stop scripts for macOS, Linux, and Windows in `scripts/`.
- [x] Serve simple example HTML from `/` through FastAPI as an initial integration checkpoint.
- [x] Add a simple API route such as `/api/health` returning JSON.
- [x] Document how to run the scaffold locally.

Tests:
- Backend unit test for the health endpoint.
- Manual smoke test that the start script launches the app locally.
- Manual smoke test that `/` returns example HTML and `/api/health` returns JSON.
- Manual smoke test that the stop script shuts the app down cleanly.

Success criteria:
- Running the local start flow launches one working app stack.
- `/` is served by FastAPI.
- At least one API route responds successfully.
- Docker build and container run complete successfully.

## Part 3: Add in Frontend

Goal: replace the placeholder HTML with the existing frontend, built statically and served by the backend.

Checklist:
- [x] Integrate the existing `frontend/` app into the combined backend-served setup.
- [x] Configure the frontend build output so the backend can serve it at `/`.
- [x] Preserve the existing Kanban interactions during the integration, including add column, move column, delete column, add card, delete card, rename, and drag/drop.
- [x] Ensure required `data-testid` attributes are present across the shipped UI.
- [x] Update tests and build scripts for the combined setup.

Tests:
- Frontend unit tests for the board state helpers and core board behavior.
- Frontend integration/component tests for adding columns, moving columns, deleting columns, renaming columns, adding cards, deleting cards, and moving cards.
- End-to-end test that `/` loads the Kanban board from the combined app.
- End-to-end test for add-column behavior.
- Manual smoke test of the static asset serving path in Docker.

Success criteria:
- `/` displays the existing Kanban board through the backend-served app.
- Existing board interactions still work after integration, including creating, moving, and deleting columns.
- Automated frontend test coverage passes in the integrated setup.

## Part 4: Add in a fake user sign in experience

Goal: gate access to the Kanban board behind a simple local login flow using the fixed MVP credentials.

Checklist:
- [x] Define the minimal auth flow for one hardcoded user: username `user`, password `password`.
- [x] Add a login screen shown to unauthenticated visitors at `/`.
- [x] Add backend session handling or an equally simple local-auth mechanism appropriate for the MVP.
- [x] Add logout support.
- [x] Keep the implementation compatible with future multi-user persistence.

Tests:
- Backend test for successful and failed login attempts.
- Frontend/component tests for the login form and error state.
- End-to-end test for login, access to board, and logout.

Success criteria:
- Unauthenticated users cannot access the board UI.
- Logging in with `user` / `password` reveals the board.
- Logging out returns the user to the login screen.

## Part 5: Database modeling

Goal: define and document the persistence model for a single-board-per-user MVP using SQLite and JSON board state.

Checklist:
- [x] Propose the SQLite schema for users and board storage.
- [x] Decide how the Kanban board JSON is stored and versioned.
- [x] Document database initialization and migration expectations for the MVP.
- [x] Save the database design in `docs/`.
- [x] Pause for user sign-off before implementing persistence.

Tests:
- Manual design review for schema simplicity, future multi-user support, and compatibility with the MVP scope.

Success criteria:
- The schema supports multiple users even though only one hardcoded login is exposed in the MVP.
- The board can be stored and retrieved as JSON without unnecessary complexity.
- The user explicitly approves the database approach.

## Part 6: Backend

Goal: implement persistent board APIs backed by SQLite, including automatic database creation.

Checklist:
- [x] Initialize the SQLite database automatically if it does not exist.
- [x] Implement backend data access for users and boards.
- [x] Add API routes to fetch the current user's board.
- [x] Add API routes to update the current user's board.
- [x] Validate request payloads and response models with simple, explicit schemas.
- [x] Keep the backend logic narrow and MVP-focused.

Tests:
- Backend unit tests for database initialization.
- Backend unit tests for board read/write operations.
- Backend API tests for authenticated access, validation failures, and successful board updates.

Success criteria:
- Starting the app creates the database when missing.
- Authenticated users can fetch and update their persisted board.
- Backend tests pass consistently.

## Part 7: Frontend + Backend

Goal: connect the frontend to the backend so board state persists across sessions.

Checklist:
- [x] Replace in-memory-only board initialization with API-backed loading.
- [x] Persist add-column, move-column, delete-column, rename, add-card, delete-card, and move-card operations through backend calls.
- [x] Handle loading and error states simply and clearly.
- [x] Preserve or improve existing test coverage for the user-visible flows.
- [x] Implement the required rename behavior so edits are only committed intentionally and outside-click reverts unsaved changes.

Tests:
- Frontend tests for API-backed load and save flows.
- End-to-end tests for persistence across page reloads.
- End-to-end or component tests confirming outside-click while editing a column title reverts unsaved changes.
- Regression tests for adding columns, moving columns, deleting columns, adding cards, deleting cards, and moving cards with backend persistence.

Success criteria:
- The board persists after refresh and across login sessions for the same user.
- The rename interaction matches the requirement exactly.
- The integrated frontend/backend test suite passes.

## Part 8: AI connectivity

Goal: prove the backend can successfully call OpenRouter using the configured API key and model.

Checklist:
- [x] Add backend configuration loading for `OPENROUTER_API_KEY`.
- [x] Implement a thin OpenRouter client wrapper.
- [x] Use the configured model `openai/gpt-oss-120b`.
- [x] Add a simple backend test path or script for an AI connectivity check.
- [x] Implement the required simple prompt to validate connectivity.

Tests:
- Manual or automated connectivity test that sends `2+2` and verifies a valid AI response.
- Backend unit tests for configuration validation and client error handling.

Success criteria:
- The backend can make a successful OpenRouter request using project configuration.
- The connectivity check is documented and repeatable.

## Part 9: Structured AI board updates

Goal: extend AI requests so the backend always sends board JSON plus conversation context and receives structured output with chat text and optional board updates.

Checklist:
- [ ] Define the structured output schema for AI responses.
- [ ] Send the current board JSON, user message, and conversation history to the model.
- [ ] Parse and validate the structured response.
- [ ] Support responses that include only chat text or chat text plus a board update.
- [ ] Apply any returned board update safely on the backend side.
- [ ] Document the request/response contract.

Tests:
- Backend unit tests for structured response parsing and validation.
- Backend tests for responses with no board change.
- Backend tests for responses with valid board updates.
- Backend tests for malformed or partial model output handling.

Success criteria:
- Each AI request includes board state and conversation history.
- The backend returns a clean structured response to the frontend.
- Optional board updates are applied only when valid.

## Part 10: AI sidebar UI

Goal: add a sidebar chat experience that lets the user talk to the AI and see board updates reflected in the UI automatically.

Checklist:
- [ ] Design and implement a sidebar chat panel in the frontend.
- [ ] Add message history rendering and input handling.
- [ ] Connect the sidebar to the backend AI endpoint.
- [ ] Refresh the board automatically when the AI returns an update.
- [ ] Keep the interaction visually polished but MVP-simple.
- [ ] Add `data-testid` coverage for the AI UI.

Tests:
- Frontend/component tests for sidebar rendering, message submission, and loading/error states.
- End-to-end tests for AI chat requests from the sidebar.
- End-to-end tests confirming the board updates automatically after an AI-triggered change.

Success criteria:
- The sidebar supports a complete AI chat flow.
- The AI can update one or more cards through the structured backend response.
- The board refreshes automatically after a valid AI change.

## Cross-cutting standards

Apply throughout all implementation parts:
- Keep the architecture simple and MVP-focused.
- Identify root cause before fixing issues.
- Prefer latest stable, idiomatic library usage.
- Keep docs concise.
- Add or preserve `data-testid` attributes on shipped UI.
- Add automated tests alongside each behavior change rather than leaving test debt for later.

## Approval gate

Implementation should begin only after the user reviews and approves this plan and the related documentation updates created in Part 1.
