import { describe, expect, it } from 'vitest';
import { isProduct, isProductList, isProductSearchResult } from './responseShape';

const product = { id: 1, name: 'iPhone', description: 'Phone', price: 999.99, stockQuantity: 3, category: 'Phones', imageUrl: null };

describe('isProduct', () => {
  it('accepts a product with the rendered fields', () => {
    expect(isProduct(product)).toBe(true);
    expect(isProduct({ id: 2, name: 'Mug', price: 0, stockQuantity: 0 })).toBe(true);
  });

  it.each([
    ['a missing body', undefined],
    ['an HTML error page', '<html>502 Bad Gateway</html>'],
    ['an array', [product]],
    ['a localised name object', { ...product, name: { en: 'iPhone' } }],
    ['a blank name', { ...product, name: '  ' }],
    ['a string price', { ...product, price: '999.99' }],
    ['a missing price', { ...product, price: undefined }],
    ['a NaN price', { ...product, price: Number.NaN }],
    ['a missing stock level', { ...product, stockQuantity: undefined }],
    ['a zero id', { ...product, id: 0 }],
    ['a fractional id', { ...product, id: 1.5 }],
    ['an object category', { ...product, category: { name: 'Phones' } }],
    ['a numeric description', { ...product, description: 42 }],
    ['an object image URL', { ...product, imageUrl: {} }],
  ])('rejects %s', (_label, value) => {
    expect(isProduct(value)).toBe(false);
  });
});

describe('isProductList', () => {
  it('accepts an array of products, including an empty one', () => {
    expect(isProductList([product])).toBe(true);
    expect(isProductList([])).toBe(true);
  });

  it('rejects a non-array body or one malformed product', () => {
    expect(isProductList({ content: [product] })).toBe(false);
    expect(isProductList('')).toBe(false);
    expect(isProductList([product, { ...product, price: 'free' }])).toBe(false);
  });
});

describe('isProductSearchResult', () => {
  it('accepts a page of products', () => {
    expect(isProductSearchResult({ content: [product], totalElements: 1, totalPages: 1 })).toBe(true);
    expect(isProductSearchResult({ content: [] })).toBe(true);
  });

  it.each([
    ['a missing body', null],
    ['an array', [product]],
    ['a missing content list', { totalElements: 0 }],
    ['a malformed product', { content: [{ ...product, name: { en: 'iPhone' } }], totalElements: 1 }],
    ['a string total', { content: [], totalElements: '0' }],
    ['a string page count', { content: [], totalPages: '1' }],
  ])('rejects %s', (_label, value) => {
    expect(isProductSearchResult(value)).toBe(false);
  });
});
