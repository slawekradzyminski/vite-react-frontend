import type { Payment } from '../types/payment';
import type { Order } from '../types/order';

export function paymentFixture(overrides: Partial<Payment> = {}): Payment {
  return {
    id: '7b0c2f4e-1d3a-4c55-9a0e-0f2b8c1d4e5f',
    orderId: 42,
    status: 'CAPTURED',
    amount: 59.97,
    currency: 'USD',
    cardBrand: 'VISA',
    cardLast4: '4242',
    failureCode: null,
    failureMessage: null,
    refundedAmount: 0,
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    ...overrides,
  };
}

export function orderFixture(overrides: Partial<Order> = {}): Order {
  return {
    id: 42,
    username: 'alice',
    items: [{ id: 1, productId: 3, productName: 'Desk lamp', quantity: 3, unitPrice: 19.99, totalPrice: 59.97 }],
    totalAmount: 59.97,
    status: 'PENDING',
    shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zipCode: '00-001', country: 'PL' },
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    ...overrides,
  };
}

export const axiosError = (status?: number, data: unknown = {}) =>
  Object.assign(new Error('Request failed'), { isAxiosError: true, response: status === undefined ? undefined : { status, data } });

export const ok = <T,>(data: T) => ({ data }) as never;
