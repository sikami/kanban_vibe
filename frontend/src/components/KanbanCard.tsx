import { useState, type FormEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  columnId: string;
  onEdit: (cardId: string, title: string, details: string) => void;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, columnId, onEdit, onDelete }: KanbanCardProps) => {
  const cardTestId = `card-${card.id}`;
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(card.title);
  const [draftDetails, setDraftDetails] = useState(card.details);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStartEdit = () => {
    setDraftTitle(card.title);
    setDraftDetails(card.details);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftTitle(card.title);
    setDraftDetails(card.details);
    setIsEditing(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      return;
    }

    onEdit(card.id, nextTitle, draftDetails.trim());
    setIsEditing(false);
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "rounded-2xl border border-transparent bg-white px-4 py-4 shadow-[0_12px_24px_rgba(3,33,71,0.08)]",
        "transition-all duration-150",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
      )}
      {...attributes}
      {...listeners}
      data-testid={cardTestId}
    >
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          data-testid={`${cardTestId}-edit-form`}
        >
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-semibold text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            placeholder="Card title"
            data-testid={`${cardTestId}-edit-title`}
          />
          <textarea
            value={draftDetails}
            onChange={(event) => setDraftDetails(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm leading-6 text-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)]"
            placeholder="Details"
            data-testid={`${cardTestId}-edit-details`}
          />
          <div className="flex items-center gap-2" data-testid={`${cardTestId}-edit-actions`}>
            <button
              type="submit"
              className="rounded-full bg-[var(--secondary-purple)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
              data-testid={`${cardTestId}-save`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-full border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
              data-testid={`${cardTestId}-cancel`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3" data-testid={`${cardTestId}-header`}>
          <div data-testid={`${cardTestId}-content`}>
            <h4
              className="font-display text-base font-semibold text-[var(--navy-dark)]"
              data-testid={`${cardTestId}-title`}
            >
              {card.title}
            </h4>
            <p
              className="mt-2 text-sm leading-6 text-[var(--gray-text)]"
              data-testid={`${cardTestId}-details`}
            >
              {card.details}
            </p>
          </div>
          <div className="flex items-center gap-2" data-testid={`${cardTestId}-actions`}>
            <button
              type="button"
              onClick={handleStartEdit}
              className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:border-[var(--stroke)] hover:text-[var(--navy-dark)]"
              aria-label={`Edit ${card.title}`}
              data-testid={`card-edit-${columnId}-${card.id}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:border-[var(--stroke)] hover:text-[var(--navy-dark)]"
              aria-label={`Delete ${card.title}`}
              data-testid={`card-delete-${columnId}-${card.id}`}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
