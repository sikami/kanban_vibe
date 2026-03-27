import { useState, type FormEvent } from "react";

const initialFormState = { title: "", details: "" };

type NewCardFormProps = {
  columnId: string;
  onAdd: (title: string, details: string) => void;
};

export const NewCardForm = ({ columnId, onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const formTestId = `new-card-${columnId}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }
    onAdd(formState.title.trim(), formState.details.trim());
    setFormState(initialFormState);
    setIsOpen(false);
  };

  return (
    <div className="mt-4" data-testid={`${formTestId}-container`}>
      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          data-testid={`${formTestId}-form`}
        >
          <input
            value={formState.title}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Card title"
            className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus-visible:ring-4 focus-visible:ring-[color:rgba(15,111,161,0.18)]"
            required
            data-testid={`${formTestId}-title`}
          />
          <textarea
            value={formState.details}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, details: event.target.value }))
            }
            placeholder="Details"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus-visible:ring-4 focus-visible:ring-[color:rgba(15,111,161,0.18)]"
            data-testid={`${formTestId}-details`}
          />
          <div className="flex items-center gap-2" data-testid={`${formTestId}-actions`}>
            <button
              type="submit"
              className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(117,57,145,0.22)]"
              data-testid={`${formTestId}-submit`}
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormState(initialFormState);
              }}
              className="rounded-full border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--navy-dark)] transition hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(3,33,71,0.14)]"
              data-testid={`${formTestId}-cancel`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-full border border-dashed border-[var(--primary-blue)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--navy-dark)] transition hover:bg-[color:rgba(15,111,161,0.06)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(15,111,161,0.18)]"
          data-testid={`${formTestId}-open`}
        >
          Add a card
        </button>
      )}
    </div>
  );
};
