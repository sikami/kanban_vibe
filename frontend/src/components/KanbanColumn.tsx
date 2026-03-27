import type { FocusEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card, Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  titleValue: string;
  onStartRename: (columnId: string) => void;
  onRenameDraftChange: (columnId: string, title: string) => void;
  onCommitRename: (columnId: string) => void;
  onCancelRename: () => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onDeleteColumn: (columnId: string) => void;
};

export const KanbanColumn = ({
  column,
  cards,
  titleValue,
  onStartRename,
  onRenameDraftChange,
  onCommitRename,
  onCancelRename,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
}: KanbanColumnProps) => {
  const columnTestId = `column-${column.id}`;
  const columnMetaTestId = `column-meta-${column.id}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof HTMLElement &&
      nextTarget.dataset.columnTitleOwner === column.id
    ) {
      return;
    }

    onCancelRename();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommitRename(column.id);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelRename();
      event.currentTarget.blur();
    }
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex min-h-[520px] flex-col rounded-3xl border border-[var(--stroke)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] transition",
        isDragging && "z-10 opacity-70 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
      )}
      data-testid={columnTestId}
    >
      <div className="flex items-start justify-between gap-3" data-testid={`column-header-${column.id}`}>
        <div className="w-full" data-testid={columnMetaTestId}>
          <div className="flex items-center gap-3" data-testid={`column-meta-row-${column.id}`}>
            <div
              className="h-2 w-10 rounded-full bg-[var(--accent-yellow)]"
              data-testid={`column-accent-${column.id}`}
            />
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
              data-testid={`column-count-${column.id}`}
            >
              {cards.length} cards
            </span>
          </div>
          <input
            value={titleValue}
            onFocus={() => onStartRename(column.id)}
            onChange={(event) => onRenameDraftChange(column.id, event.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-[var(--navy-dark)] outline-none"
            aria-label="Column title"
            data-testid={`column-title-${column.id}`}
            data-column-title-owner={column.id}
          />
        </div>
        <button
          type="button"
          className="rounded-full border border-[var(--stroke)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:border-[var(--navy-dark)] hover:text-[var(--navy-dark)]"
          aria-label={`Move column ${column.title}`}
          data-testid={`column-drag-${column.id}`}
          {...attributes}
          {...listeners}
        >
          Move
        </button>
        <button
          type="button"
          onClick={() => onDeleteColumn(column.id)}
          className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:border-[var(--stroke)] hover:text-[var(--navy-dark)]"
          aria-label={`Delete column ${column.title}`}
          data-testid={`column-delete-${column.id}`}
        >
          X
        </button>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3" data-testid={`column-cards-${column.id}`}>
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div
            className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--stroke)] px-3 py-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
            data-testid={`column-empty-${column.id}`}
          >
            Drop a card here
          </div>
        )}
      </div>
      <NewCardForm
        columnId={column.id}
        onAdd={(title, details) => onAddCard(column.id, title, details)}
      />
    </section>
  );
};
