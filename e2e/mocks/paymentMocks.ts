import type { Page, Route } from '@playwright/test';
import { fulfillWithPaymentSchema, fulfillWithSchema, type BackendSchema, type PaymentSchema } from './backendContract';

export type PaymentOrder = BackendSchema<'OrderDto'> & { id: number };
type Payment = PaymentSchema<'PaymentDto'>;
type CreatePayment = PaymentSchema<'CreatePaymentDto'>;

export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function pendingOrder(id: number, username: string, overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return {
    id,
    username,
    status: 'PENDING',
    totalAmount: 59.97,
    amountDue: 59.97,
    items: [{ id: 1, productId: 3, productName: 'Desk lamp', quantity: 3, unitPrice: 19.99, totalPrice: 59.97 }],
    shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zipCode: '00-001', country: 'Poland' },
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    ...overrides,
  };
}

/**
 * A simulated payment-service following the contract's test cards. It records each
 * Idempotency-Key and marks the order PAID once a payment is captured, like the backend
 * does after the result notification.
 */
export class PaymentServiceMock {
  readonly payments: Payment[] = [];
  readonly idempotencyKeys: string[] = [];
  readonly pollsBeforeSettling: number;
  private polls = 0;

  constructor(private readonly order: PaymentOrder, { pollsBeforeSettling = 1 } = {}) {
    this.pollsBeforeSettling = pollsBeforeSettling;
  }

  async install(page: Page) {
    await page.route(`**/api/v1/orders/${this.order.id}`, async (route) => {
      await fulfillWithSchema(route, 'OrderDto', this.order);
    });
    await page.route(`**/api/v1/orders/${this.order.id}/payments`, async (route) => {
      await fulfillWithPaymentSchema(route, 'PaymentDto', [...this.payments].reverse());
    });
    await page.route('**/api/v1/payments', (route) => this.create(route));
    await page.route(/\/api\/v1\/payments\/[^/]+(\/3ds)?$/, (route) => this.paymentById(route));
  }

  private payment(status: Payment['status'], number: string, overrides: Partial<Payment> = {}): Payment {
    const now = new Date().toISOString();
    return {
      id: `00000000-0000-4000-8000-${String(this.payments.length + 1).padStart(12, '0')}`,
      orderId: this.order.id,
      status,
      amount: this.order.amountDue ?? this.order.totalAmount ?? 0,
      currency: 'USD',
      cardBrand: number.startsWith('5') ? 'MASTERCARD' : 'VISA',
      cardLast4: number.slice(-4),
      refundedAmount: 0,
      failureCode: null,
      failureMessage: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  private settle(payment: Payment, status: Payment['status'], failureCode: string | null = null) {
    payment.status = status;
    payment.failureCode = failureCode;
    payment.nextAction = undefined;
    if (status === 'CAPTURED') this.order.status = 'PAID';
  }

  private async create(route: Route) {
    if (route.request().method() !== 'POST') return route.fallback();
    const key = route.request().headers()['idempotency-key'] ?? '';
    this.idempotencyKeys.push(key);
    if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
      return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Idempotency-Key is required' }) });
    }
    const body = route.request().postDataJSON() as CreatePayment;
    const number = body.card.number;
    let payment: Payment;
    switch (number) {
      case '4000000000000002':
        payment = this.payment('FAILED', number, { failureCode: 'CARD_DECLINED', failureMessage: 'Your card was declined' });
        break;
      case '4000000000003220':
        payment = this.payment('REQUIRES_ACTION', number, { nextAction: { type: 'THREE_DS_CHALLENGE', hint: 'Enter code 123456 to approve' } });
        break;
      case '4000000000000077':
        payment = this.payment('PROCESSING', number);
        break;
      default:
        payment = this.payment('CAPTURED', number);
        this.order.status = 'PAID';
    }
    this.payments.push(payment);
    await fulfillWithPaymentSchema(route, 'PaymentDto', payment, 201);
  }

  private async paymentById(route: Route) {
    const url = new URL(route.request().url());
    const [, id, action] = /\/api\/v1\/payments\/([^/]+)(\/3ds)?$/.exec(url.pathname) ?? [];
    const payment = this.payments.find((candidate) => candidate.id === id);
    if (!payment) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Payment not found' }) });
    if (action) {
      const { code } = route.request().postDataJSON() as PaymentSchema<'ThreeDsDto'>;
      if (code === '123456') this.settle(payment, 'CAPTURED');
      else this.settle(payment, 'FAILED', 'THREE_DS_FAILED');
    } else if (payment.status === 'PROCESSING') {
      this.polls += 1;
      if (this.polls > this.pollsBeforeSettling) this.settle(payment, 'CAPTURED');
    }
    await fulfillWithPaymentSchema(route, 'PaymentDto', payment);
  }
}
