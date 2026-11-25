import type { ProductSearchResult } from '../types/commerce';
import type { Product } from '../types/product';

// Runtime checks for the product payloads the storefront renders. A body that does not match
// (a proxy error page, a truncated response, a field of the wrong type) must show an error the
// user can retry instead of "No products found", "$NaN" or a render crash.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown) => value === undefined || value === null || typeof value === 'string';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** The fields a product page or card renders: an id, a name, a price and the stock level. */
export function isProduct(value: unknown): value is Product {
  return (
    isRecord(value)
    && Number.isSafeInteger(value.id)
    && (value.id as number) > 0
    && typeof value.name === 'string'
    && value.name.trim() !== ''
    && isFiniteNumber(value.price)
    && isFiniteNumber(value.stockQuantity)
    && isOptionalString(value.description)
    && isOptionalString(value.category)
    && isOptionalString(value.imageUrl)
  );
}

export function isProductList(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

export function isProductSearchResult(value: unknown): value is ProductSearchResult {
  return (
    isRecord(value)
    && Array.isArray(value.content)
    && value.content.every(isProduct)
    && (value.totalElements === undefined || isFiniteNumber(value.totalElements))
    && (value.totalPages === undefined || isFiniteNumber(value.totalPages))
  );
}
