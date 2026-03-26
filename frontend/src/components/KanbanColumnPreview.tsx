import type { Column } from "@/lib/kanban";

type KanbanColumnPreviewProps = {
  column: Column;
  cardCount: number;
};

export const KanbanColumnPreview = ({
  column,
  cardCount,
}: KanbanColumnPreviewProps) => (
  <section className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface-strong)] p-4 shadow-[0_18px_32px_rgba(3,33,71,0.16)]">
    <div className="flex items-start justify-between gap-3">
      <div className="w-full">
        <div className="flex items-center gap-3">
          <div className="h-2 w-10 rounded-full bg-[var(--accent-yellow)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            {cardCount} cards
          </span>
        </div>
        <p className="mt-3 font-display text-lg font-semibold text-[var(--navy-dark)]">
          {column.title}
        </p>
      </div>
    </div>
  </section>
);
