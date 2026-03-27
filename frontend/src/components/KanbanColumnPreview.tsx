import type { Column } from "@/lib/kanban";

type KanbanColumnPreviewProps = {
  column: Column;
  cardCount: number;
};

export const KanbanColumnPreview = ({
  column,
  cardCount,
}: KanbanColumnPreviewProps) => (
  <section
    className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface-strong)] p-4 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
    data-testid={`column-preview-${column.id}`}
  >
    <div className="flex items-start justify-between gap-3" data-testid={`column-preview-${column.id}-header`}>
      <div className="w-full" data-testid={`column-preview-${column.id}-meta`}>
        <div className="flex items-center gap-3" data-testid={`column-preview-${column.id}-meta-row`}>
          <div
            className="h-2 w-10 rounded-full bg-[var(--accent-yellow)]"
            data-testid={`column-preview-${column.id}-accent`}
          />
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
            data-testid={`column-preview-${column.id}-count`}
          >
            {cardCount} cards
          </span>
        </div>
        <p
          className="mt-3 font-display text-lg font-semibold text-[var(--navy-dark)]"
          data-testid={`column-preview-${column.id}-title`}
        >
          {column.title}
        </p>
      </div>
    </div>
  </section>
);
