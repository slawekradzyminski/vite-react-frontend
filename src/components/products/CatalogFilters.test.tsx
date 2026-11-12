import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogFilters } from './CatalogFilters';

const viewportWidth = (width: number) => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: width >= Number(/(\d+)rem/.exec(query)?.[1]) * 16, media: query }));
};

describe('CatalogFilters', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('starts folded on phones and opens on demand', async () => {
    // given
    viewportWidth(360);
    const user = userEvent.setup();
    render(<CatalogFilters activeCount={2}><p>Category list</p></CatalogFilters>);
    const toggle = screen.getByRole('button', { name: /Filters \(2\)/ });

    // then
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('products-filters-panel')).toHaveClass('hidden');
    expect(toggle).toHaveAttribute('aria-controls', screen.getByTestId('products-filters-panel').id);

    // when
    await user.click(toggle);

    // then
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('products-filters-panel')).not.toHaveClass('hidden');
  });

  it.each([1024, 1440])('starts open at %ipx', (width) => {
    // given
    viewportWidth(width);

    // when
    render(<CatalogFilters activeCount={0}><p>Category list</p></CatalogFilters>);

    // then
    expect(screen.getByTestId('products-filters-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('products-filters-toggle')).toHaveTextContent(/^Filters/);
    expect(screen.getByTestId('products-filters-panel')).not.toHaveClass('hidden');
  });
});
