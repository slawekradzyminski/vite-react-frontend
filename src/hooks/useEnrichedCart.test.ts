import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { products } from '../lib/api';
import { useEnrichedCart, type RawCartResponse } from './useEnrichedCart';

vi.mock('../lib/api', () => ({ products: { getProductById: vi.fn() } }));

describe('nested GraphQL cart presentation', () => {
  it('uses supplied details and decimal totals without per-item catalog requests', async () => {
    // given
    const source: RawCartResponse = { enriched: true, username: 'alice', totalItems: 3, totalPrice: 2999.97,
      items: [{ productId: 42, productName: 'Book', imageUrl: 'book.png', quantity: 3, unitPrice: 999.99, totalPrice: 2999.97 }] };
    // when
    const { result } = renderHook(() => useEnrichedCart(source));
    await waitFor(() => expect(result.current.isEnriching).toBe(false));
    // then
    expect(result.current.cartData.items[0]).toMatchObject({ productName: 'Book', imageUrl: 'book.png', totalPrice: 2999.97 });
    expect(result.current.cartData.totalPrice).toBe(2999.97);
    expect(products.getProductById).not.toHaveBeenCalled();
  });
});
