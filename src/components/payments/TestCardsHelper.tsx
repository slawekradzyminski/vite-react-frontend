import { useId, useState } from 'react';
import { TEST_CARDS, type TestCard } from '../../lib/payment';

/** Collapsible list of the simulated provider's test cards; picking one fills the form. */
export function TestCardsHelper({ onPick }: { onPick: (card: TestCard) => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <div className="rounded-[1.25rem] border border-dashed border-sky-200 bg-sky-50/60 p-4" data-testid="payment-test-cards">
      <button
        type="button"
        className="text-sm font-semibold text-sky-900 underline-offset-4 hover:underline"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        data-testid="payment-test-cards-toggle"
      >
        {open ? 'Hide test cards' : 'Show test cards'}
      </button>
      {open && (
        <ul id={listId} className="mt-3 space-y-2" data-testid="payment-test-cards-list">
          {TEST_CARDS.map((card) => {
            const key = card.number.replace(/\s/g, '');
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <span className="font-mono text-slate-900">{card.number}</span>
                  <span className="ml-2 text-slate-600">{card.label}: {card.outcome}</span>
                </span>
                <button
                  type="button"
                  className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
                  onClick={() => onPick(card)}
                  aria-label={`Use test card ${card.number} (${card.label})`}
                  data-testid={`payment-test-card-${key}`}
                >
                  Use
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
