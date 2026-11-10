import type { Page, Route } from '@playwright/test';
import { fulfillWithSchema, type BackendSchema } from './backendContract';

export type SearchItem = BackendSchema<'ProductSearchItemDto'>;

const SORTS: Record<string, (a: SearchItem, b: SearchItem) => number> = {
  price_asc: (a, b) => (a.price ?? 0) - (b.price ?? 0) || (a.id ?? 0) - (b.id ?? 0),
  price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0) || (a.id ?? 0) - (b.id ?? 0),
  name_asc: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
  rating_desc: (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || (a.name ?? '').localeCompare(b.name ?? ''),
};

/**
 * A small in-memory version of GET /api/v1/products/search, following docs/PRODUCT_SEARCH.md:
 * facets cover every filter except category; relevance and newest keep the catalogue order.
 */
export function searchCatalogue(catalogue: SearchItem[], url: URL): BackendSchema<'ProductSearchResultDto'> {
  const params = url.searchParams;
  const q = params.get('q')?.trim().toLowerCase() ?? '';
  const categories = params.getAll('category').flatMap((value) => value.split(',')).map((value) => value.toLowerCase());
  const minPrice = params.has('minPrice') ? Number(params.get('minPrice')) : undefined;
  const maxPrice = params.has('maxPrice') ? Number(params.get('maxPrice')) : undefined;
  const minRating = params.has('minRating') ? Number(params.get('minRating')) : undefined;
  const inStock = params.get('inStock') === 'true';
  const page = Number(params.get('page') ?? 0);
  const size = Number(params.get('size') ?? 20);

  const facetBase = catalogue.filter((item) =>
    (!q || [item.name, item.category, item.description].some((value) => value?.toLowerCase().includes(q)))
    && (minPrice === undefined || (item.price ?? 0) >= minPrice)
    && (maxPrice === undefined || (item.price ?? 0) <= maxPrice)
    && (minRating === undefined || (item.averageRating != null && item.averageRating >= minRating))
    && (!inStock || (item.stockQuantity ?? 0) > 0));
  const matches = facetBase.filter((item) => categories.length === 0 || categories.includes((item.category ?? '').toLowerCase()));
  const sorter = SORTS[params.get('sort') ?? ''];
  const sorted = sorter ? [...matches].sort(sorter) : matches;
  const counts = new Map<string, number>();
  facetBase.forEach((item) => counts.set(item.category ?? '', (counts.get(item.category ?? '') ?? 0) + 1));
  const prices = facetBase.map((item) => item.price ?? 0);

  return {
    content: sorted.slice(page * size, page * size + size),
    pageNumber: page,
    pageSize: size,
    totalElements: matches.length,
    totalPages: Math.ceil(matches.length / size),
    facets: {
      categories: [...counts.entries()]
        .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
        .map(([value, count]) => ({ value, count })),
      priceRange: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null },
      inStockCount: facetBase.filter((item) => (item.stockQuantity ?? 0) > 0).length,
    },
  };
}

export const productSearchMocks = {
  /** Serves the search endpoint from `catalogue` and records every query it received. */
  async mockSearch(page: Page, catalogue: SearchItem[]) {
    const requests: URL[] = [];
    await page.route(/\/api\/v1\/products\/search(\?|$)/, async (route: Route) => {
      const url = new URL(route.request().url());
      requests.push(url);
      const minPrice = url.searchParams.get('minPrice');
      const maxPrice = url.searchParams.get('maxPrice');
      if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
        await fulfillWithSchema(route, 'ValidationErrorsDto', { minPrice: 'must not be greater than maxPrice' }, 400);
        return;
      }
      await fulfillWithSchema(route, 'ProductSearchResultDto', searchCatalogue(catalogue, url));
    });
    return requests;
  },
};
