import { vi } from 'vitest';

// Inert stubs for the commerce API groups, for tests that mock '../../lib/api'
// but render components which also show coupons, wishlists or reviews.
export function commerceApiMocks() {
  const emptyPage = { data: { content: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 20 } };
  return {
    cartCoupon: {
      summary: vi.fn().mockResolvedValue({ data: { couponCode: null, discountAmount: 0 } }),
      apply: vi.fn(),
      remove: vi.fn(),
    },
    wishlist: { list: vi.fn().mockResolvedValue({ data: [] }), upsert: vi.fn(), remove: vi.fn() },
    reviews: {
      list: vi.fn().mockResolvedValue(emptyPage),
      summary: vi.fn().mockResolvedValue({ data: { reviewCount: 0, averageRating: null, distribution: {} } }),
      mine: vi.fn().mockResolvedValue({ data: { canReview: false, reason: 'Only customers who received this product can review it' } }),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    catalogCsv: { export: vi.fn(), import: vi.fn() },
    warehouse: { trackOrder: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 404 } }) },
    returns: { create: vi.fn(), mine: vi.fn().mockResolvedValue(emptyPage) },
  };
}
