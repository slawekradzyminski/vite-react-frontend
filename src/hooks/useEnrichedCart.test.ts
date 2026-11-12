import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { products } from '../lib/api';
import { useEnrichedCart, type RawCartResponse } from './useEnrichedCart';

vi.mock('../lib/api', () => ({ products: { getProductById: vi.fn() } }));

describe('nested GraphQL cart presentation', () => {
  it('uses supplied details and decimal totals without per-item catalog requests', async () => {
    // given
    const source: RawCartResponse = { enriched: true, username: 'alice', totalItems: 3, totalPrice: 2999.97,
      items: [{ productId: 42, productName: 'Book', imageUrl: 'book.png', quantity: 3, unitPrice: 999.99, totalPrice: 2999.97, stockQuantity: 8 }] };
    // when
    const { result } = renderHook(() => useEnrichedCart(source));
    await waitFor(() => expect(result.current.isEnriching).toBe(false));
    // then
    expect(result.current.cartData.items[0]).toMatchObject({ productName: 'Book', imageUrl: 'book.png', totalPrice: 2999.97, stockQuantity: 8 });
    expect(result.current.cartData.totalPrice).toBe(2999.97);
    expect(products.getProductById).not.toHaveBeenCalled();
  });

  it('takes stock from the product it already loads for a REST cart', async () => {
    // given
    vi.mocked(products.getProductById).mockResolvedValue({ data: { id: 7, name: 'Lamp', price: 20, stockQuantity: 4, imageUrl: '' } } as never);
    const source: RawCartResponse = { username: 'bob', items: [{ productId: 7, quantity: 1 }] };

    // when
    const { result } = renderHook(() => useEnrichedCart(source));
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    // then
    expect(result.current.cartData.items[0]).toMatchObject({ productId: 7, stockQuantity: 4 });
    expect(products.getProductById).toHaveBeenCalledTimes(1);
  });

  it('keeps the price change the backend reports for a REST cart line', async () => {
    // given
    vi.mocked(products.getProductById).mockResolvedValue({ data: { id: 9, name: 'Mug', price: 12.5, stockQuantity: 5, imageUrl: '' } } as never);
    const source: RawCartResponse = { username: 'bob', items: [
      { productId: 9, quantity: 2, unitPrice: 10, priceChanged: true, currentPrice: 12.5 },
    ] };

    // when
    const { result } = renderHook(() => useEnrichedCart(source));
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    // then
    expect(result.current.cartData.items[0]).toMatchObject({ unitPrice: 10, totalPrice: 20, priceChanged: true, currentPrice: 12.5 });
  });

  it('reports no price change for a line the backend did not flag', async () => {
    // given
    vi.mocked(products.getProductById).mockResolvedValue({ data: { id: 9, name: 'Mug', price: 12.5, stockQuantity: 5, imageUrl: '' } } as never);
    const source: RawCartResponse = { username: 'bob', items: [{ productId: 9, quantity: 1 }] };

    // when
    const { result } = renderHook(() => useEnrichedCart(source));
    await waitFor(() => expect(result.current.isEnriching).toBe(false));

    // then
    expect(result.current.cartData.items[0]).not.toHaveProperty('priceChanged');
    expect(result.current.cartData.items[0]).not.toHaveProperty('currentPrice');
  });
});
