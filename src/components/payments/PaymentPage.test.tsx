import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentPage } from './PaymentPage';
import { orders, payments } from '../../lib/api';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok, orderFixture, paymentFixture } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({
  orders: { getOrderById: vi.fn() },
  payments: { create: vi.fn(), get: vi.fn(), confirmThreeDs: vi.fn(), forOrder: vi.fn() },
}));

const now = () => new Date(2027, 0, 15);

function renderPage(route = '/orders/42/pay') {
  return renderWithRoute(<PaymentPage now={now} flowOptions={{ pollIntervalMs: 5, timeoutMs: 1000 }} />, { route, path: '/orders/:id/pay' });
}

async function payWith(number: string) {
  await userEvent.type(await screen.findByTestId('payment-card-number-input'), number);
  await userEvent.type(screen.getByTestId('payment-card-expiry-input'), '1230');
  await userEvent.type(screen.getByTestId('payment-card-cvc-input'), '123');
  await userEvent.type(screen.getByTestId('payment-card-holder-input'), 'Alice');
  await userEvent.click(screen.getByTestId('payment-submit'));
}

describe('PaymentPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(orders.getOrderById).mockResolvedValue(ok(orderFixture()));
    vi.mocked(payments.forOrder).mockResolvedValue(ok([]));
  });

  it('shows the order summary and the card form for a pending order', async () => {
    // given / when
    renderPage();
    // then
    expect(await screen.findByTestId('payment-title')).toHaveTextContent('Pay for order #42');
    expect(screen.getByTestId('payment-order-amount-due')).toHaveTextContent('$59.97');
    expect(screen.getByTestId('payment-submit')).toHaveTextContent('Pay $59.97');
    expect(orders.getOrderById).toHaveBeenCalledWith(42);
  });

  it('shows a success screen with a link to the order after capture', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture()));
    renderPage();
    // when
    await payWith('4242424242424242');
    // then
    expect(await screen.findByTestId('payment-success')).toHaveTextContent('Payment received');
    expect(screen.getByTestId('payment-success-details')).toHaveTextContent('$59.97 was charged to Visa •••• 4242');
    await userEvent.click(screen.getByTestId('payment-success-order-link'));
    expect(screen.getByTestId('test-location')).toHaveTextContent('/orders/42');
  });

  it('explains a decline and lets the customer try another card', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture({ status: 'FAILED', failureCode: 'CARD_DECLINED', cardLast4: '0002' })));
    renderPage();
    // when
    await payWith('4000000000000002');
    // then
    expect(await screen.findByTestId('payment-failed-message')).toHaveTextContent('Your card was declined');
    await userEvent.click(screen.getByTestId('payment-try-another-card'));
    expect(screen.getByTestId('payment-card-number-input')).toHaveValue('');
  });

  it('runs 3-D Secure in a dialog and can reopen it after cancelling', async () => {
    // given
    vi.mocked(payments.create).mockResolvedValue(ok(paymentFixture({ status: 'REQUIRES_ACTION' })));
    vi.mocked(payments.confirmThreeDs).mockResolvedValue(ok(paymentFixture()));
    renderPage();
    await payWith('4000000000003220');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    // when cancelling and reopening
    await userEvent.click(screen.getByTestId('payment-3ds-cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('payment-3ds-reopen'));
    await userEvent.type(screen.getByTestId('payment-3ds-code-input'), '123456');
    await userEvent.click(screen.getByTestId('payment-3ds-submit'));
    // then
    expect(await screen.findByTestId('payment-success')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows processing while polling and then the result', async () => {
    // given
    const processing = paymentFixture({ status: 'PROCESSING', cardLast4: '0077' });
    vi.mocked(payments.create).mockResolvedValue(ok(processing));
    vi.mocked(payments.get).mockResolvedValueOnce(ok(processing)).mockResolvedValue(ok(paymentFixture({ cardLast4: '0077' })));
    renderPage();
    // when
    await payWith('4000000000000077');
    // then
    expect(await screen.findByTestId('payment-processing')).toHaveTextContent('Processing…');
    expect(await screen.findByTestId('payment-success')).toBeInTheDocument();
  });

  it('shows a timeout message once polling gives up', async () => {
    // given
    const processing = paymentFixture({ status: 'PROCESSING' });
    vi.mocked(payments.create).mockResolvedValue(ok(processing));
    vi.mocked(payments.get).mockResolvedValue(ok(processing));
    renderWithRoute(<PaymentPage now={now} flowOptions={{ pollIntervalMs: 5, timeoutMs: 20 }} />, { route: '/orders/42/pay', path: '/orders/:id/pay' });
    // when
    await payWith('4000000000000077');
    // then
    expect(await screen.findByTestId('payment-timeout-message')).toHaveTextContent('still processing');
    expect(screen.getByTestId('payment-check-again')).toBeInTheDocument();
    expect(screen.getByTestId('payment-timeout-order-link')).toHaveAttribute('href', '/orders/42');
  });

  it('explains a 409 and links back to the order', async () => {
    // given
    vi.mocked(payments.create).mockRejectedValue(axiosError(409, { message: 'Order is not payable' }));
    renderPage();
    // when
    await payWith('4242424242424242');
    // then
    expect(await screen.findByTestId('payment-not-payable-message')).toHaveTextContent('This order cannot be paid: Order is not payable');
    expect(screen.getByTestId('payment-not-payable-order-link')).toHaveAttribute('href', '/orders/42');
  });

  it('shows the reservation countdown next to the card form', async () => {
    // given
    vi.mocked(orders.getOrderById).mockResolvedValue(ok(orderFixture({ reservationExpiresAt: new Date(Date.now() + 5 * 60_000).toISOString() })));
    // when
    renderPage();
    // then
    expect(await screen.findByTestId('reservation-countdown')).toHaveTextContent(/Reserved until \d\d:\d\d/);
    expect(screen.getByTestId('payment-submit')).toBeInTheDocument();
  });

  it('reloads the order when payment-service refuses an expired reservation and says why', async () => {
    // given
    const expiresAt = '2027-01-15T10:00:00.000Z';
    vi.mocked(orders.getOrderById)
      .mockResolvedValueOnce(ok(orderFixture({ reservationExpiresAt: new Date(Date.now() + 60_000).toISOString() })))
      .mockResolvedValue(ok(orderFixture({ status: 'CANCELLED', reservationExpiresAt: expiresAt, updatedAt: '2027-01-15T10:00:03.000Z' })));
    vi.mocked(payments.create).mockRejectedValue(axiosError(409, { message: 'Order reservation expired' }));
    renderPage();
    // when
    await payWith('4242424242424242');
    // then
    expect(await screen.findByTestId('payment-not-payable-message')).toHaveTextContent('This order cannot be paid: Order reservation expired');
    expect(await screen.findByTestId('reservation-expired')).toBeInTheDocument();
    expect(vi.mocked(orders.getOrderById).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips the card form when gift card and points cover the order', async () => {
    // given
    vi.mocked(orders.getOrderById).mockResolvedValue(ok(orderFixture({ amountDue: 0, giftCardCode: 'GC-1', giftCardAmount: 59.97 })));
    // when
    renderPage();
    // then
    expect(await screen.findByTestId('payment-paid-by-tenders')).toHaveTextContent('Paid with gift card / points');
    expect(screen.queryByTestId('payment-card-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('payment-not-required-order-link')).toHaveAttribute('href', '/orders/42');
  });

  it.each([
    ['PAID', 'payment-already-paid'],
    ['CANCELLED', 'payment-order-cancelled'],
  ] as const)('does not offer the card form for a %s order', async (status, testId) => {
    // given
    vi.mocked(orders.getOrderById).mockResolvedValue(ok(orderFixture({ status })));
    // when
    renderPage();
    // then
    expect(await screen.findByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByTestId('payment-card-form')).not.toBeInTheDocument();
  });

  it('offers to continue a payment that is still waiting for 3-D Secure', async () => {
    // given
    vi.mocked(payments.forOrder).mockResolvedValue(ok([paymentFixture({ status: 'REQUIRES_ACTION' })]));
    renderPage();
    // when
    await userEvent.click(await screen.findByTestId('payment-resume'));
    // then
    expect(screen.getByRole('dialog', { name: '3-D Secure verification' })).toBeInTheDocument();
  });

  it('says so when the order does not exist', async () => {
    // given
    vi.mocked(orders.getOrderById).mockRejectedValue(axiosError(404));
    // when
    renderPage('/orders/999/pay');
    // then
    expect(await screen.findByTestId('payment-order-not-found')).toBeInTheDocument();
  });

  it('does not query anything for a malformed id', async () => {
    // given / when
    renderPage('/orders/abc/pay');
    // then
    expect(await screen.findByTestId('payment-order-not-found')).toBeInTheDocument();
    await waitFor(() => expect(orders.getOrderById).not.toHaveBeenCalled());
    expect(payments.forOrder).not.toHaveBeenCalled();
  });

  it('does not round an id beyond the safe integer range into another order', async () => {
    // given / when
    renderPage('/orders/9223372036854775807/pay');
    // then
    expect(await screen.findByTestId('payment-order-not-found')).toBeInTheDocument();
    expect(orders.getOrderById).not.toHaveBeenCalled();
  });
});
