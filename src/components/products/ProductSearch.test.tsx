import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { productSearch } from '../../lib/api';
import type { ProductSearchParams, ProductSearchResult } from '../../types/commerce';
import { ProductSearch } from './ProductSearch';

vi.mock('../../lib/api', () => ({ productSearch: { search: vi.fn() } }));

vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }: { product: { id: number; name: string; averageRating: number | null; reviewCount: number } }) => (
    <div data-testid={`card-${product.id}`}>{product.name} · {product.averageRating ?? '-'} ({product.reviewCount})</div>
  ),
}));

const agent = vi.hoisted(() => ({ onSearch: undefined as undefined | ((query: string, inStockOnly: boolean) => void) }));
vi.mock('../../features/webmcp/useShopWebMcp', () => ({
  useShopWebMcp: (onSearch: (query: string, inStockOnly: boolean) => void) => {
    agent.onSearch = onSearch;
    return { tools: [], calls: [], status: 'WebMCP unavailable in this browser' };
  },
}));

const LocationProbe = () => <output data-testid="location-search">{useLocation().search}</output>;

const result = (overrides: Partial<ProductSearchResult> = {}): ProductSearchResult => ({
  content: [
    { id: 1, name: 'Armchair', price: 120, category: 'Chairs', stockQuantity: 2, averageRating: 4.5, reviewCount: 2 },
    { id: 2, name: 'Lamp', price: 30, category: 'Lighting', stockQuantity: 0, averageRating: null, reviewCount: 0 },
  ],
  pageNumber: 0,
  pageSize: 12,
  totalElements: 2,
  totalPages: 1,
  facets: {
    categories: [{ value: 'Chairs', count: 1 }, { value: 'Lighting', count: 1 }],
    priceRange: { min: 30, max: 120 },
    inStockCount: 1,
  },
  ...overrides,
});

const renderAt = (url = '/products') => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[url]}>
      <ProductSearch />
      <LocationProbe />
    </MemoryRouter>
  </QueryClientProvider>,
);

const lastParams = (): ProductSearchParams => {
  const calls = vi.mocked(productSearch.search).mock.calls;
  return calls[calls.length - 1]?.[0] ?? {};
};
const location = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '');

describe('ProductSearch', () => {
  beforeEach(() => {
    vi.mocked(productSearch.search).mockResolvedValue({ data: result() } as never);
  });
  afterEach(() => vi.clearAllMocks());

  it('shows results with review statistics, facets and a summary', async () => {
    // when
    renderAt();

    // then
    expect(await screen.findByTestId('card-1')).toHaveTextContent('Armchair · 4.5 (2)');
    expect(screen.getByTestId('card-2')).toHaveTextContent('Lamp · - (0)');
    expect(screen.getByTestId('product-list-title')).toHaveTextContent('All Products');
    expect(screen.getByTestId('products-category-count-chairs')).toHaveTextContent('1');
    expect(screen.getByTestId('product-in-stock-count')).toHaveTextContent('1');
    expect(screen.getByTestId('product-search-summary')).toHaveTextContent('Showing 1–2 of 2');
    expect(screen.getByTestId('products-count-summary')).toHaveTextContent('2 products match');
    expect(screen.getByTestId('product-min-price')).toHaveAttribute('placeholder', '30');
    expect(lastParams()).toEqual({ page: 0, size: 12 });
    expect(screen.queryByTestId('product-pagination')).not.toBeInTheDocument();
  });

  it('searches 300 ms after typing stops and keeps the text in the URL', async () => {
    // given
    const user = userEvent.setup();
    renderAt();
    await screen.findByTestId('card-1');

    // when
    await user.type(screen.getByRole('textbox', { name: 'Search products' }), 'arm');

    // then
    expect(vi.mocked(productSearch.search).mock.calls.some(([params]) => params?.q)).toBe(false);
    await waitFor(() => expect(lastParams()).toMatchObject({ q: 'arm', page: 0 }));
    expect(vi.mocked(productSearch.search).mock.calls.filter(([params]) => params?.q).map(([params]) => params?.q)).toEqual(['arm']);
    expect(location().get('q')).toBe('arm');
  });

  it('searches immediately on Enter and clears the text', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByTestId('card-1');

    await user.type(screen.getByTestId('product-search'), 'lamp{Enter}');
    expect(location().get('q')).toBe('lamp');

    await user.click(screen.getByTestId('clear-search'));
    expect(location().get('q')).toBeNull();
    expect(screen.getByTestId('product-search')).toHaveValue('');
  });

  it('filters by several categories with keyboard-operable checkboxes', async () => {
    // given
    const user = userEvent.setup();
    renderAt('/products?page=2');
    await screen.findByTestId('card-1');

    // when
    const chairs = screen.getByRole('checkbox', { name: /Chairs/ });
    chairs.focus();
    await user.keyboard(' ');
    await user.click(screen.getByRole('checkbox', { name: /Lighting/ }));

    // then
    await waitFor(() => expect(lastParams()).toMatchObject({ category: ['Chairs', 'Lighting'], page: 0 }));
    expect(location().getAll('category')).toEqual(['Chairs', 'Lighting']);
    expect(location().get('page')).toBeNull();
    expect(screen.getByTestId('product-list-title')).toHaveTextContent('Products in 2 categories');

    // when
    await user.click(screen.getByTestId('products-category-all'));

    // then
    expect(location().getAll('category')).toEqual([]);
  });

  it('keeps a selected category visible when it has no matches', async () => {
    vi.mocked(productSearch.search).mockResolvedValue({ data: result({ content: [], totalElements: 0, totalPages: 0, facets: { categories: [] } }) } as never);
    renderAt('/products?category=Garden');

    expect(await screen.findByTestId('products-category-garden')).toBeChecked();
    expect(screen.getByTestId('products-category-count-garden')).toHaveTextContent('0');
    expect(screen.getByTestId('product-list-title')).toHaveTextContent('Garden Products');
  });

  it('applies price, rating, stock and sort filters', async () => {
    // given
    const user = userEvent.setup();
    renderAt();
    await screen.findByTestId('card-1');

    // when
    await user.type(screen.getByLabelText('Min'), '10');
    await user.type(screen.getByLabelText('Max'), '99.5');
    await user.click(screen.getByTestId('product-price-apply'));
    await user.selectOptions(screen.getByLabelText('Customer rating'), '4');
    await user.click(screen.getByRole('checkbox', { name: /In stock only/ }));
    await user.selectOptions(screen.getByLabelText('Sort by:'), 'price-desc');

    // then
    await waitFor(() => expect(lastParams()).toEqual({
      page: 0, size: 12, minPrice: 10, maxPrice: 99.5, minRating: 4, inStock: true, sort: 'price_desc',
    }));
    expect(location().toString()).toBe('minPrice=10&maxPrice=99.5&minRating=4&inStock=1&sort=price-desc');

    // when the default sort is chosen again
    await user.selectOptions(screen.getByTestId('product-sort'), 'relevance');

    // then
    expect(location().get('sort')).toBeNull();
    await user.click(screen.getByTestId('product-clear-filters'));
    expect(location().toString()).toBe('');
  });

  it('pages through results', async () => {
    // given
    vi.mocked(productSearch.search).mockImplementation(async (params) => ({
      data: result({ pageNumber: params?.page, totalElements: 30, totalPages: 3 }),
    }) as never);
    const user = userEvent.setup();
    renderAt();
    await screen.findByTestId('card-1');
    expect(screen.getByTestId('product-pagination-prev')).toBeDisabled();

    // when
    await user.click(screen.getByTestId('product-pagination-next'));

    // then
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 1 }));
    expect(location().get('page')).toBe('2');
    expect(screen.getByTestId('product-pagination-status')).toHaveTextContent('Page 2 of 3');
    expect(screen.getByTestId('product-search-summary')).toHaveTextContent('Showing 13–24 of 30');

    // when
    await user.click(screen.getByTestId('product-pagination-next'));
    expect(screen.getByTestId('product-pagination-next')).toBeDisabled();
    await user.click(screen.getByTestId('product-pagination-prev'));
    await user.click(screen.getByTestId('product-pagination-prev'));

    // then
    expect(location().get('page')).toBeNull();
  });

  it('offers the first page when a link points past the end', async () => {
    vi.mocked(productSearch.search).mockResolvedValue({ data: result({ content: [], totalElements: 2, totalPages: 1 }) } as never);
    const user = userEvent.setup();
    renderAt('/products?page=5');

    await user.click(await screen.findByTestId('product-first-page-button'));

    expect(location().get('page')).toBeNull();
  });

  it('shows the empty state with a way back', async () => {
    // given
    vi.mocked(productSearch.search).mockResolvedValue({ data: result({ content: [], totalElements: 0, totalPages: 0 }) } as never);
    const user = userEvent.setup();
    renderAt('/products?q=zzz&inStock=1');

    // when
    expect(await screen.findByTestId('no-products-message')).toHaveTextContent('No products found');
    await user.click(screen.getByTestId('reset-search-button'));

    // then
    expect(location().toString()).toBe('');
    expect(screen.getByTestId('product-search')).toHaveValue('');
  });

  it('shows 400 validation messages inline next to the filters', async () => {
    // given
    vi.mocked(productSearch.search).mockRejectedValue(Object.assign(new Error('Bad Request'), {
      isAxiosError: true,
      response: { status: 400, data: { minPrice: 'must not be greater than maxPrice', sort: 'must be one of relevance' } },
    }));

    // when
    renderAt('/products?minPrice=50&maxPrice=10');

    // then
    const errors = await screen.findByRole('alert');
    expect(within(errors).getByTestId('product-search-error-minPrice')).toHaveTextContent('minPrice: must not be greater than maxPrice');
    expect(screen.getByTestId('product-min-price-error')).toHaveTextContent('Min: must not be greater than maxPrice');
    expect(screen.getByTestId('product-min-price')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(productSearch.search).toHaveBeenCalledTimes(1);
  });

  it('reports other failures', async () => {
    vi.mocked(productSearch.search).mockRejectedValue(Object.assign(new Error('Server'), { isAxiosError: true, response: { status: 404 } }));
    renderAt();
    expect(await screen.findByTestId('error-message')).toHaveTextContent('Error loading products');
  });

  it('lets the WebMCP search tool drive the visible search', async () => {
    // given
    renderAt('/products?category=Chairs&page=2');
    await screen.findByTestId('card-1');

    // when
    act(() => agent.onSearch?.('  lamp  ', true));

    // then
    await waitFor(() => expect(lastParams()).toEqual({ q: 'lamp', inStock: true, sort: 'price_asc', page: 0, size: 12 }));
    expect(screen.getByTestId('product-search')).toHaveValue('  lamp  ');
    expect(screen.getByTestId('product-sort')).toHaveValue('price-asc');
    expect(screen.getByTestId('product-in-stock-only')).toBeChecked();
    expect(screen.getByTestId('product-list-title')).toHaveTextContent('All Products');
    expect(location().get('category')).toBeNull();
    // The debounce settling on the agent's text writes nothing new.
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(location().get('q')).toBe('  lamp  ');
  });
});
