import type { ReactNode } from 'react';
import { Surface } from '../ui/surface';

export function ProductsHero({ summary }: { summary: ReactNode }) {
  return (
    <Surface as="section" variant="hero" padding="xl" data-testid="products-hero">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Catalog</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="products-title">
            Products
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Browse the live assortment, narrow by category, and move directly into product detail or cart actions.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-3 text-sm text-slate-600" data-testid="products-count-summary">
          {summary}
        </div>
      </div>
    </Surface>
  );
}
