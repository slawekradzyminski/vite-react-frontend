import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { productSearch } from '../../lib/api';
import { retryServerErrors } from '../../lib/requestErrors';
import {
  MIN_RATING_OPTIONS,
  SEARCH_PAGE_SIZE,
  SEARCH_SORT_OPTIONS,
  categorySlug,
  readSearchFilters,
  searchValidationErrors,
  toSearchParams,
  toSearchProduct,
} from '../../lib/productSearch';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useShopWebMcp } from '../../features/webmcp/useShopWebMcp';
import { ShopToolPanel } from '../../features/webmcp/ShopToolPanel';
import type { CategoryFacet } from '../../types/commerce';
import { ProductCard } from './ProductCard';
import { ProductsHero } from './ProductsHero';
import { Surface } from '../ui/surface';

export const SEARCH_DEBOUNCE_MS = 300;
const fieldClass = 'h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-slate-300 focus:bg-white';

type FilterChanges = Record<string, string | string[] | null>;

function PriceRangeForm({ minPrice, maxPrice, placeholderMin, placeholderMax, errors, onApply }: {
  minPrice: string;
  maxPrice: string;
  placeholderMin?: number | null;
  placeholderMax?: number | null;
  errors: Record<string, string>;
  onApply: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply(min.trim(), max.trim());
  };
  return (
    <form className="space-y-2" onSubmit={submit} aria-labelledby="product-price-heading" data-testid="product-price-form">
      <h3 id="product-price-heading" className="text-sm font-semibold text-slate-900">Price (USD)</h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-600">
          Min
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={`mt-1 ${fieldClass}`}
            value={min}
            placeholder={placeholderMin != null ? String(placeholderMin) : '0'}
            onChange={(event) => setMin(event.target.value)}
            aria-invalid={errors.minPrice ? true : undefined}
            aria-describedby={errors.minPrice ? 'product-min-price-error' : undefined}
            data-testid="product-min-price"
          />
        </label>
        <label className="text-xs text-slate-600">
          Max
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={`mt-1 ${fieldClass}`}
            value={max}
            placeholder={placeholderMax != null ? String(placeholderMax) : 'Any'}
            onChange={(event) => setMax(event.target.value)}
            aria-invalid={errors.maxPrice ? true : undefined}
            aria-describedby={errors.maxPrice ? 'product-max-price-error' : undefined}
            data-testid="product-max-price"
          />
        </label>
      </div>
      {errors.minPrice && <p id="product-min-price-error" className="text-xs text-red-700" data-testid="product-min-price-error">Min: {errors.minPrice}</p>}
      {errors.maxPrice && <p id="product-max-price-error" className="text-xs text-red-700" data-testid="product-max-price-error">Max: {errors.maxPrice}</p>}
      <button type="submit" className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 hover:text-slate-900" data-testid="product-price-apply">
        Apply price
      </button>
    </form>
  );
}

/** Server-side catalogue search (REST transport); every filter lives in the URL. */
export function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readSearchFilters(searchParams), [searchParams]);
  const apiParams = useMemo(() => toSearchParams(filters), [filters]);

  // Filter changes go back to the first page and replace the history entry; paging pushes one.
  const updateFilters = useCallback((changes: FilterChanges) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(changes).forEach(([key, value]) => {
        next.delete(key);
        if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
        else if (value) next.set(key, value);
      });
      if (!('page' in changes)) next.delete('page');
      return next;
    }, { replace: !('page' in changes) });
  }, [setSearchParams]);

  // The text box is local state so typing stays responsive; the URL follows after a pause.
  const urlQuery = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(urlQuery);
  const writtenQuery = useRef(urlQuery);
  const commitQuery = useCallback((value: string) => {
    writtenQuery.current = value;
    updateFilters({ q: value || null });
  }, [updateFilters]);
  // Back, Forward and agent searches change the URL directly; mirror them into the box.
  useEffect(() => {
    if (urlQuery !== writtenQuery.current) {
      writtenQuery.current = urlQuery;
      setTerm(urlQuery);
    }
  }, [urlQuery]);
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  const lastDebounced = useRef(debouncedTerm);
  useEffect(() => {
    if (debouncedTerm === lastDebounced.current) return;
    lastDebounced.current = debouncedTerm;
    if (debouncedTerm !== writtenQuery.current) commitQuery(debouncedTerm);
  }, [debouncedTerm, commitQuery]);

  // An agent search covers every category, like the client-side catalogue.
  const onAgentSearch = useCallback((query: string, inStockOnly: boolean) => {
    setTerm(query);
    writtenQuery.current = query;
    updateFilters({ category: null, q: query || null, inStock: inStockOnly ? '1' : null, sort: 'price-asc' });
  }, [updateFilters]);
  const pageOptions = new URLSearchParams(window.location.search);
  const webmcp = useShopWebMcp(onAgentSearch, pageOptions.get('tools') !== 'off');

  const search = useQuery({
    // Under 'products' so stock-changing mutations that invalidate the catalogue refresh it too.
    queryKey: ['products', 'search', apiParams],
    queryFn: async () => (await productSearch.search(apiParams)).data,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
  });

  const validationErrors = axios.isAxiosError(search.error) && search.error.response?.status === 400
    ? searchValidationErrors(search.error.response.data)
    : {};
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const result = hasValidationErrors ? undefined : search.data;
  const items = (result?.content ?? []).map(toSearchProduct);
  const totalElements = result?.totalElements ?? 0;
  const totalPages = result?.totalPages ?? 0;

  const facetCategories: CategoryFacet[] = [...(result?.facets?.categories ?? [])];
  filters.categories.forEach((category) => {
    if (!facetCategories.some((facet) => facet.value?.toLowerCase() === category.toLowerCase())) {
      facetCategories.push({ value: category, count: 0 });
    }
  });
  const isSelected = (category: string) => filters.categories.some((value) => value.toLowerCase() === category.toLowerCase());
  const toggleCategory = (category: string, checked: boolean) => {
    const next = checked
      ? [...filters.categories, category]
      : filters.categories.filter((value) => value.toLowerCase() !== category.toLowerCase());
    updateFilters({ category: next });
  };
  const clearAll = () => {
    setTerm('');
    writtenQuery.current = '';
    updateFilters({ q: null, category: null, minPrice: null, maxPrice: null, minRating: null, inStock: null, sort: null });
  };
  const hasFilters = Boolean(filters.q || filters.categories.length || filters.minPrice || filters.maxPrice || filters.minRating || filters.inStock);

  const title = filters.categories.length === 1
    ? `${filters.categories[0]} Products`
    : filters.categories.length > 1 ? `Products in ${filters.categories.length} categories` : 'All Products';
  const firstShown = totalElements === 0 ? 0 : (filters.page - 1) * SEARCH_PAGE_SIZE + 1;
  const lastShown = Math.min(filters.page * SEARCH_PAGE_SIZE, totalElements);
  const goToPage = (page: number) => updateFilters({ page: page > 1 ? String(page) : null });

  const renderResults = () => {
    if (search.isLoading) {
      return <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center text-slate-500" data-testid="product-list-loading">Loading products...</div>;
    }
    if (search.isError && !hasValidationErrors) {
      return <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600" role="alert" data-testid="error-message">Error loading products</div>;
    }
    if (hasValidationErrors) return null;
    if (items.length === 0) {
      return (
        <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center" data-testid="no-products-message">
          <p className="mb-2 text-lg font-medium text-slate-900">No products found</p>
          {filters.page > 1 && totalElements > 0 ? (
            <button onClick={() => goToPage(1)} className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800" data-testid="product-first-page-button">
              Go to the first page
            </button>
          ) : hasFilters && (
            <div className="mt-4" data-testid="empty-search-actions">
              <p className="mb-3 text-sm text-slate-600">Try adjusting your search or</p>
              <button onClick={clearAll} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800" data-testid="reset-search-button">
                Clear filters
              </button>
            </div>
          )}
        </div>
      );
    }
    return (
      <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy={search.isFetching} data-testid="product-list">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Product pages" data-testid="product-pagination">
            <button
              type="button"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => goToPage(filters.page - 1)}
              disabled={filters.page <= 1}
              data-testid="product-pagination-prev"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600" data-testid="product-pagination-status">Page {filters.page} of {totalPages}</span>
            <button
              type="button"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => goToPage(filters.page + 1)}
              disabled={filters.page >= totalPages}
              data-testid="product-pagination-next"
            >
              Next
            </button>
          </nav>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 pb-10" data-testid="products-page">
      <ProductsHero summary={result ? `${totalElements} ${totalElements === 1 ? 'product matches' : 'products match'}` : 'Searching the catalogue'} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]" data-testid="products-layout">
        <aside className="xl:sticky xl:top-24 xl:self-start" data-testid="products-sidebar">
          <Surface variant="muted" padding="md" className="space-y-6" data-testid="products-categories-container">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Filter</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950" data-testid="products-categories-title">Categories</h2>
              <fieldset className="mt-4" data-testid="product-filter-category">
                <legend className="sr-only">Categories</legend>
                <button
                  type="button"
                  className={`mb-2 w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${filters.categories.length === 0 ? 'bg-slate-900 text-stone-50' : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'}`}
                  onClick={() => updateFilters({ category: null })}
                  aria-pressed={filters.categories.length === 0}
                  data-testid="products-category-all"
                >
                  All Products
                </button>
                {facetCategories.length === 0 && !search.isLoading && (
                  <p className="text-sm text-slate-500" data-testid="products-categories-empty">No categories match</p>
                )}
                <ul className="space-y-1" data-testid="products-categories-list">
                  {facetCategories.map((facet) => {
                    const value = facet.value ?? '';
                    const slug = categorySlug(value);
                    return (
                      <li key={value} data-testid={`products-category-item-${slug}`}>
                        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-stone-100">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected(value)}
                              onChange={(event) => toggleCategory(value, event.target.checked)}
                              data-testid={`products-category-${slug}`}
                            />
                            {value}
                          </span>
                          <span className="text-xs text-slate-500" data-testid={`products-category-count-${slug}`}>{facet.count ?? 0}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            </div>

            <PriceRangeForm
              key={`${filters.minPrice}|${filters.maxPrice}`}
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              placeholderMin={result?.facets?.priceRange?.min}
              placeholderMax={result?.facets?.priceRange?.max}
              errors={validationErrors}
              onApply={(min, max) => updateFilters({ minPrice: min || null, maxPrice: max || null })}
            />

            <div>
              <label htmlFor="product-min-rating" className="text-sm font-semibold text-slate-900">Customer rating</label>
              <select
                id="product-min-rating"
                className={`mt-2 ${fieldClass}`}
                value={filters.minRating}
                onChange={(event) => updateFilters({ minRating: event.target.value || null })}
                data-testid="product-min-rating"
              >
                <option value="">Any rating</option>
                {MIN_RATING_OPTIONS.map((rating) => <option key={rating} value={String(rating)}>{rating}★ &amp; up</option>)}
              </select>
            </div>

            <label className="flex items-center justify-between gap-2 text-sm text-slate-700">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(event) => updateFilters({ inStock: event.target.checked ? '1' : null })}
                  data-testid="product-in-stock-only"
                />
                In stock only
              </span>
              {result?.facets?.inStockCount != null && <span className="text-xs text-slate-500" data-testid="product-in-stock-count">{result.facets.inStockCount}</span>}
            </label>

            {hasFilters && (
              <button type="button" onClick={clearAll} className="w-full rounded-full px-4 py-2 text-sm font-medium text-slate-600 underline-offset-4 hover:underline" data-testid="product-clear-filters">
                Clear all filters
              </button>
            )}
          </Surface>
        </aside>

        <div className="min-w-0" data-testid="products-content">
          <ShopToolPanel {...webmcp} initialOpen={pageOptions.get('inspect') === '1'} />
          <div className="mb-6 rounded-[1.75rem] border border-stone-200/80 bg-white/84 p-5 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]" data-testid="product-list-controls">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Browse</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950" data-testid="product-list-title">{title}</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-testid="product-list-filters">
                <div className="relative min-w-[220px] flex-1" data-testid="product-search-container">
                  <input
                    type="text"
                    aria-label="Search products"
                    placeholder="Search products..."
                    maxLength={100}
                    className={`${fieldClass} pr-10`}
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        if (term !== writtenQuery.current) commitQuery(term);
                      }
                    }}
                    data-testid="product-search"
                  />
                  {term && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition hover:text-slate-700"
                      onClick={() => { setTerm(''); commitQuery(''); }}
                      data-testid="clear-search"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2" data-testid="product-sort-container">
                  <label htmlFor="sort" className="text-sm font-medium text-slate-600" data-testid="product-sort-label">Sort by:</label>
                  <select
                    id="sort"
                    className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                    value={filters.sort}
                    onChange={(event) => updateFilters({ sort: event.target.value === 'relevance' ? null : event.target.value })}
                    data-testid="product-sort"
                  >
                    {SEARCH_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {hasValidationErrors && (
              <ul className="mt-4 space-y-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" data-testid="product-search-errors">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field} data-testid={`product-search-error-${field}`}>{field}: {message}</li>
                ))}
              </ul>
            )}
            {result && !hasValidationErrors && (
              <p className="mt-4 text-sm text-slate-600" role="status" data-testid="product-search-summary">
                {totalElements === 0 ? 'No matching products' : `Showing ${firstShown}–${lastShown} of ${totalElements}`}
                {search.isFetching ? ' · updating…' : ''}
              </p>
            )}
          </div>
          {renderResults()}
        </div>
      </div>
    </div>
  );
}
