import { describe, expect, it } from 'vitest';
import {
  categorySlug,
  readSearchFilters,
  searchValidationErrors,
  toSearchParams,
  toSearchProduct,
} from './productSearch';

const read = (query: string) => readSearchFilters(new URLSearchParams(query));

describe('product search parameters', () => {
  it('reads defaults from an empty URL', () => {
    expect(read('')).toEqual({
      q: '', categories: [], minPrice: '', maxPrice: '', minRating: '', inStock: false, sort: 'relevance', page: 1,
    });
  });

  it('reads every filter and keeps the legacy names', () => {
    // given the parameters the client-side catalogue and WebMCP already write
    const filters = read('q=lap&category=Tech&category=Home,Office&inStock=1&sort=price-asc&minPrice=10&maxPrice=99.5&minRating=4&page=3');

    // then
    expect(filters).toEqual({
      q: 'lap', categories: ['Tech', 'Home', 'Office'], minPrice: '10', maxPrice: '99.5', minRating: '4', inStock: true, sort: 'price-asc', page: 3,
    });
    expect(read('inStock=true').inStock).toBe(true);
  });

  it('ignores values it cannot use', () => {
    const filters = read('sort=name-desc&page=0&minRating=7&category=%20&inStock=0');
    expect(filters.sort).toBe('relevance');
    expect(filters.page).toBe(1);
    expect(filters.minRating).toBe('');
    expect(filters.categories).toEqual([]);
    expect(filters.inStock).toBe(false);
    expect(read('page=2.5').page).toBe(1);
  });

  it('builds API parameters with a zero-based page and underscore sorts', () => {
    // when
    const params = toSearchParams(read('q=%20lap%20&category=Tech&inStock=1&sort=price-desc&minPrice=10&maxPrice=99.5&minRating=4&page=3'));

    // then
    expect(params).toEqual({
      q: 'lap', category: ['Tech'], inStock: true, sort: 'price_desc', minPrice: 10, maxPrice: 99.5, minRating: 4, page: 2, size: 12,
    });
  });

  it('omits absent filters and the default sort', () => {
    expect(toSearchParams(read('q=%20%20'))).toEqual({ page: 0, size: 12 });
    expect(toSearchParams(read('sort=rating-desc'), 5)).toEqual({ page: 0, size: 5, sort: 'rating_desc' });
    expect(toSearchParams(read('sort=newest')).sort).toBe('newest');
    expect(toSearchParams(read('sort=name-asc')).sort).toBe('name_asc');
  });

  it('passes a malformed price through so the backend reports it', () => {
    expect(toSearchParams(read('minPrice=cheap')).minPrice).toBe('cheap');
  });

  it('maps search items to products with review statistics', () => {
    expect(toSearchProduct({ id: 1, name: 'Chair', price: 120, stockQuantity: 2, category: 'Chairs', imageUrl: null, averageRating: 4.5, reviewCount: 2 }))
      .toEqual({ id: 1, name: 'Chair', description: '', price: 120, stockQuantity: 2, category: 'Chairs', imageUrl: '', createdAt: undefined, updatedAt: undefined, averageRating: 4.5, reviewCount: 2 });
    expect(toSearchProduct({})).toMatchObject({ id: 0, name: '', price: 0, averageRating: null, reviewCount: 0 });
  });

  it('extracts field messages from a 400 body', () => {
    expect(searchValidationErrors({ minPrice: 'must not be greater than maxPrice', empty: false })).toEqual({ minPrice: 'must not be greater than maxPrice' });
    expect(searchValidationErrors(null)).toEqual({});
    expect(searchValidationErrors(['x'])).toEqual({});
    expect(searchValidationErrors('bad')).toEqual({});
  });

  it('slugs categories for test ids', () => {
    expect(categorySlug('Home Office')).toBe('home-office');
  });
});
