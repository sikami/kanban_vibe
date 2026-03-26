# Frontend App Notes

## Purpose

`frontend/` contains the current MVP starting point: a standalone Next.js Kanban demo. It already provides the visual board and core in-browser interactions, but it is not yet integrated with the backend, authentication, persistence, Docker flow, or AI features described in the project root [AGENTS.md](/Users/listya/Documents/Belajar/agentic/pm/pm/AGENTS.md).

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- `@dnd-kit` for drag-and-drop
- Vitest + Testing Library for unit/component tests
- Playwright for end-to-end tests

## Current structure

- `src/app/layout.tsx`
  Sets the global layout and shared metadata for the app shell.
- `src/app/page.tsx`
  Renders the Kanban board at `/`.
- `src/app/globals.css`
  Holds the app-wide styling tokens and global visual system.
- `src/components/KanbanBoard.tsx`
  Main client component that owns the board state and drag/drop wiring.
- `src/components/KanbanColumn.tsx`
  Renders one column, inline title editing, card list, and new-card entry point.
- `src/components/KanbanCard.tsx`
  Renders one draggable card and its delete action.
- `src/components/KanbanCardPreview.tsx`
  Drag overlay preview for cards.
- `src/components/NewCardForm.tsx`
  Expanding form used to add a new card into a column.
- `src/lib/kanban.ts`
  In-memory board types, seeded data, ID creation, and card movement helper logic.
- `src/components/KanbanBoard.test.tsx`
  Component tests for rendering, adding columns, renaming, adding, and removing cards.
- `src/lib/kanban.test.ts`
  Helper-level tests for board logic.
- `tests/kanban.spec.ts`
  Playwright smoke flows for loading the board, adding a column, adding a card, and dragging a card.

## Current behavior

- The home page renders a five-column Kanban board.
- Board state is initialized from static in-memory seed data in `src/lib/kanban.ts`.
- Users can add a new empty column from the board header.
- Column titles are editable inline.
- Cards can be added to a column.
- Cards can be deleted.
- Cards can be dragged within and across columns.
- The UI already includes `data-testid` attributes for columns and cards used by tests.

## Known gaps relative to project requirements

- No backend integration yet; all state is client-only.
- No login or logout flow.
- No persistence across refreshes.
- No Docker-aware integration.
- No AI sidebar or OpenRouter connectivity.
- No board-level title concept; the current editable titles are column titles only.
- The current column title editing behavior updates immediately on each keystroke.
  The project requirement says clicking outside while editing should discard unsaved changes and revert to the previous title, so this behavior will need to be redesigned during integration work.
- Current delete button text is "Remove" even though the requirement mentions an `x` button. This can be aligned later when polishing the final MVP behavior.

## Working guidance

- Treat this frontend as the canonical UI starting point to preserve where possible.
- Keep the implementation simple; avoid introducing extra frontend architecture before backend integration requires it.
- Preserve and extend the existing tests as behavior changes.
- Maintain `data-testid` coverage for every shipped interactive component.
