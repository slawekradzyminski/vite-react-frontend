import { useId, useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';

// Matches the products layout: from xl the filters are a sidebar next to the results; below it
// they stack above the results and fold away behind a "Filters" button.
const SIDEBAR_QUERY = '(min-width: 80rem)';
// Tablets and laptops (lg) start with the filters open; phones start with them closed.
const OPEN_BY_DEFAULT_QUERY = '(min-width: 64rem)';

function matches(query: string) {
  return typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia(query).matches;
}

export function CatalogFilters({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(() => matches(SIDEBAR_QUERY) || matches(OPEN_BY_DEFAULT_QUERY));
  const panelId = useId();

  return (
    <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start" data-testid="products-sidebar">
      <button
        type="button"
        className="mb-3 flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-stone-300 xl:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        data-testid="products-filters-toggle"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </span>
        <span className="text-xs font-medium text-slate-600">{open ? 'Hide' : 'Show'}</span>
      </button>
      <div id={panelId} className={open ? '' : 'hidden xl:block'} data-testid="products-filters-panel">
        {children}
      </div>
    </aside>
  );
}
