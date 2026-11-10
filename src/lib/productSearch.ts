import type { ProductSearchItem, ProductSearchParams, ProductSearchSort } from '../types/commerce';
import type { Product } from '../types/product';

// URL sort values keep the dash style the catalogue has always used (`price-asc`), so old
// links and the WebMCP search tool keep working; the API uses underscores.
export const SEARCH_SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', api: 'relevance' },
  { value: 'newest', label: 'Newest', api: 'newest' },
  { value: 'price-asc', label: 'Price (Low to High)', api: 'price_asc' },
  { value: 'price-desc', label: 'Price (High to Low)', api: 'price_desc' },
  { value: 'name-asc', label: 'Name (A-Z)', api: 'name_asc' },
  { value: 'rating-desc', label: 'Top rated', api: 'rating_desc' },
] as const satisfies readonly { value: string; label: string; api: ProductSearchSort }[];

export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number]['value'];
export const DEFAULT_SEARCH_SORT: SearchSort = 'relevance';
export const SEARCH_PAGE_SIZE = 12;
export const MIN_RATING_OPTIONS = [4, 3, 2, 1] as const;

export interface SearchFilters {
  q: string;
  categories: string[];
  minPrice: string;
  maxPrice: string;
  minRating: string;
  inStock: boolean;
  sort: SearchSort;
  /** One-based page shown in the URL; the API is zero-based. */
  page: number;
}

const isSort = (value: string | null): value is SearchSort =>
  SEARCH_SORT_OPTIONS.some((option) => option.value === value);

const decimal = (value: string | null) => {
  const trimmed = value?.trim() ?? '';
  return trimmed !== '' && Number.isFinite(Number(trimmed)) ? trimmed : '';
};

export function readSearchFilters(params: URLSearchParams): SearchFilters {
  const sort = params.get('sort');
  const page = Number(params.get('page'));
  const rating = Number(params.get('minRating'));
  return {
    q: params.get('q') ?? '',
    // Repeated (category=a&category=b) and comma-separated values both select several.
    categories: [...new Set(params.getAll('category').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean))],
    // Malformed numbers are passed through so the backend reports them inline.
    minPrice: params.get('minPrice')?.trim() ?? '',
    maxPrice: params.get('maxPrice')?.trim() ?? '',
    minRating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? String(rating) : '',
    inStock: params.get('inStock') === '1' || params.get('inStock') === 'true',
    sort: isSort(sort) ? sort : DEFAULT_SEARCH_SORT,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** API parameters for the filters; absent filters are omitted rather than sent blank. */
export function toSearchParams(filters: SearchFilters, size = SEARCH_PAGE_SIZE): ProductSearchParams {
  const params: Record<string, unknown> = { page: filters.page - 1, size };
  const q = filters.q.trim();
  if (q) params.q = q;
  if (filters.categories.length) params.category = filters.categories;
  if (filters.minPrice) params.minPrice = decimal(filters.minPrice) ? Number(filters.minPrice) : filters.minPrice;
  if (filters.maxPrice) params.maxPrice = decimal(filters.maxPrice) ? Number(filters.maxPrice) : filters.maxPrice;
  if (filters.minRating) params.minRating = Number(filters.minRating);
  if (filters.inStock) params.inStock = true;
  if (filters.sort !== DEFAULT_SEARCH_SORT) {
    params.sort = SEARCH_SORT_OPTIONS.find((option) => option.value === filters.sort)?.api;
  }
  return params as ProductSearchParams;
}

export type SearchProduct = Product & { averageRating: number | null; reviewCount: number };

export function toSearchProduct(item: ProductSearchItem): SearchProduct {
  return {
    id: item.id ?? 0,
    name: item.name ?? '',
    description: item.description ?? '',
    price: item.price ?? 0,
    stockQuantity: item.stockQuantity ?? 0,
    category: item.category ?? '',
    imageUrl: item.imageUrl ?? '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    averageRating: item.averageRating ?? null,
    reviewCount: item.reviewCount ?? 0,
  };
}

/** Field messages from a 400 ValidationErrorsDto, keyed by parameter name. */
export function searchValidationErrors(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

export const categorySlug = (category: string) => category.toLowerCase().replace(/\s+/g, '-');
