"use client";

import type {
  FocusEvent,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { KanbanColumnPreview } from "@/components/KanbanColumnPreview";
import {
  createId,
  initialData,
  moveCard,
  moveColumn,
  type BoardData,
} from "@/lib/kanban";

type KanbanBoardProps = {
  board?: BoardData;
  onBoardChange?: (board: BoardData) => void;
  headerActions?: ReactNode;
  headerNotice?: ReactNode;
};

export const KanbanBoard = ({
  board: controlledBoard,
  onBoardChange,
  headerActions,
  headerNotice,
}: KanbanBoardProps) => {
  const [internalBoard, setInternalBoard] = useState<BoardData>(() => initialData);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnTitleDraft, setColumnTitleDraft] = useState("");

  const board = controlledBoard ?? internalBoard;

  const updateBoard = (updater: (current: BoardData) => BoardData) => {
    const nextBoard = updater(board);
    if (!controlledBoard) {
      setInternalBoard(nextBoard);
    }
    onBoardChange?.(nextBoard);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board.cards, [board.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    if (activeId.startsWith("col-")) {
      setActiveColumnId(activeId);
      setActiveCardId(null);
      return;
    }

    setActiveCardId(activeId);
    setActiveColumnId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    setActiveColumnId(null);

    if (!over || active.id === over.id) {
      return;
    }

    if ((active.id as string).startsWith("col-")) {
      updateBoard((prev) => ({
        ...prev,
        columns: (() => {
          const overId = over.id as string;
          const overColumnId =
            prev.columns.find(
              (column) =>
                column.id === overId || column.cardIds.includes(overId)
            )?.id ?? overId;

          return moveColumn(prev.columns, active.id as string, overColumnId);
        })(),
      }));
      return;
    }

    updateBoard((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    }));
  };

  const commitColumnRename = (columnId: string) => {
    const existingColumn = board.columns.find((column) => column.id === columnId);
    if (!existingColumn) {
      setEditingColumnId(null);
      setColumnTitleDraft("");
      return;
    }

    const nextTitle = columnTitleDraft.trim();
    setEditingColumnId(null);
    setColumnTitleDraft("");

    if (!nextTitle || nextTitle === existingColumn.title) {
      return;
    }

    updateBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title: nextTitle } : column
      ),
    }));
  };

  const startColumnRename = (columnId: string) => {
    const column = board.columns.find((item) => item.id === columnId);
    if (!column) {
      return;
    }

    if (editingColumnId === columnId) {
      return;
    }

    setEditingColumnId(columnId);
    setColumnTitleDraft(column.title);
  };

  const updateColumnTitleDraft = (columnId: string, title: string) => {
    if (editingColumnId !== columnId) {
      startColumnRename(columnId);
    }
    setColumnTitleDraft(title);
  };

  const cancelColumnRename = () => {
    setEditingColumnId(null);
    setColumnTitleDraft("");
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    updateBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    updateBoard((prev) => {
      return {
        ...prev,
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => id !== cardId)
        ),
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });
  };

  const handleAddColumn = () => {
    const id = createId("col");
    updateBoard((prev) => {
      const nextColumnNumber = prev.columns.length + 1;
      return {
        ...prev,
        columns: [
          ...prev.columns,
          {
            id,
            title: `New Column ${nextColumnNumber}`,
            cardIds: [],
          },
        ],
      };
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    updateBoard((prev) => {
      const columnToDelete = prev.columns.find((column) => column.id === columnId);
      if (!columnToDelete) {
        return prev;
      }

      return {
        ...prev,
        columns: prev.columns.filter((column) => column.id !== columnId),
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(
            ([cardId]) => !columnToDelete.cardIds.includes(cardId)
          )
        ),
      };
    });
  };

  const activeCard = activeCardId ? cardsById[activeCardId] : null;
  const activeColumn = activeColumnId
    ? board.columns.find((column) => column.id === activeColumnId) ?? null
    : null;

  const getColumnTitleValue = (columnId: string, currentTitle: string) =>
    editingColumnId === columnId ? columnTitleDraft : currentTitle;

  const handlePillBlur = (columnId: string, event: FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof HTMLElement &&
      nextTarget.dataset.columnTitleOwner === columnId
    ) {
      return;
    }

    cancelColumnRename();
  };

  const handlePillKeyDown = (
    columnId: string,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitColumnRename(columnId);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelColumnRename();
      event.currentTarget.blur();
    }
  };

  return (
    <div className="relative overflow-hidden" data-testid="dashboard-page">
      <div
        className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]"
        data-testid="dashboard-background-orb-left"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]"
        data-testid="dashboard-background-orb-right"
      />

      <main
        className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12"
        data-testid="dashboard-main"
      >
        <header
          className="relative flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur"
          data-testid="dashboard-header"
        >
          {headerActions ? (
            <div
              className="absolute right-6 top-6 z-10"
              data-testid="dashboard-header-actions"
            >
              {headerActions}
            </div>
          ) : null}
          <div
            className="flex flex-wrap items-start justify-between gap-6 pr-20"
            data-testid="dashboard-header-content"
          >
            <div data-testid="dashboard-header-copy">
              <p
                className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]"
                data-testid="dashboard-eyebrow"
              >
                Single Board Kanban
              </p>
              <h1
                className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]"
                data-testid="dashboard-title"
              >
                Kanban Studio
              </h1>
              <p
                className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]"
                data-testid="dashboard-description"
              >
                Keep momentum visible. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
          </div>
          {headerNotice ? (
            <div data-testid="dashboard-header-notice">{headerNotice}</div>
          ) : null}
          <div
            className="flex flex-wrap items-center gap-4"
            data-testid="dashboard-column-pills"
          >
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
                data-testid={`dashboard-column-pill-${column.id}`}
              >
                <span
                  className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]"
                  data-testid={`dashboard-column-pill-dot-${column.id}`}
                />
                <input
                  value={getColumnTitleValue(column.id, column.title)}
                  onFocus={() => startColumnRename(column.id)}
                  onChange={(event) =>
                    updateColumnTitleDraft(column.id, event.target.value)
                  }
                  onBlur={(event) => handlePillBlur(column.id, event)}
                  onKeyDown={(event) => handlePillKeyDown(column.id, event)}
                  className="min-w-0 bg-transparent text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)] outline-none"
                  aria-label={`Dashboard column pill title ${column.title}`}
                  data-testid={`dashboard-column-pill-input-${column.id}`}
                  data-column-title-owner={column.id}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddColumn}
              className="rounded-full border border-dashed border-[var(--primary-blue)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)] transition hover:bg-[var(--primary-blue)] hover:text-white"
              data-testid="board-add-column"
            >
              Add column
            </button>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={board.columns.map((column) => column.id)}
            strategy={horizontalListSortingStrategy}
          >
            <section
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5"
              data-testid="kanban-columns"
            >
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId])}
                  titleValue={getColumnTitleValue(column.id, column.title)}
                  onStartRename={startColumnRename}
                  onRenameDraftChange={updateColumnTitleDraft}
                  onCommitRename={commitColumnRename}
                  onCancelRename={cancelColumnRename}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}
            </section>
          </SortableContext>
          <DragOverlay>
            {activeColumn ? (
              <div className="w-[280px]" data-testid="dashboard-column-overlay">
                <KanbanColumnPreview
                  column={activeColumn}
                  cardCount={activeColumn.cardIds.length}
                />
              </div>
            ) : activeCard ? (
              <div className="w-[260px]" data-testid="dashboard-card-overlay">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};
