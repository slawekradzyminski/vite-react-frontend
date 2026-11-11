import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { OrderPaymentPanel, OrderPaymentSection } from './OrderPaymentPanel';
import { auth, payments } from '../../lib/api';
import { isPaymentEnabled } from '../../lib/runtimeConfig';
import { renderWithRoute } from '../../test/renderWithRoute';
import { axiosError, ok, orderFixture, paymentFixture } from '../../test/paymentFixtures';

vi.mock('../../lib/api', () => ({
  auth: { me: vi.fn() },
  payments: { forOrder: vi.fn() },
}));
vi.mock('../../lib/runtimeConfig', () => ({ isPaymentEnabled: vi.fn(() => true) }));

describe('OrderPaymentPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isPaymentEnabled).mockReturnValue(true);
    vi.mocked(auth.me).mockResolvedValue(ok({ username: 'alice', roles: ['ROLE_CLIENT'] }));
    vi.mocked(payments.forOrder).mockResolvedValue(ok([]));
  });

  it('offers "Pay now" to the owner of a pending order', async () => {
    // given / when
    renderWithRoute(<OrderPaymentPanel order={orderFixture()} />);
    // then
    expect(await screen.findByTestId('order-payment-pay-now')).toHaveAttribute('href', '/orders/42/pay');
    expect(screen.getByTestId('order-payment-awaiting')).toHaveTextContent('Awaiting payment of $59.97');
    expect(await screen.findByTestId('order-payment-none')).toBeInTheDocument();
    expect(payments.forOrder).toHaveBeenCalledWith(42);
  });

  it('hides "Pay now" from someone else, for paid orders and when nothing is due', async () => {
    // given / when
    const { unmount } = renderWithRoute(<OrderPaymentPanel order={orderFixture({ username: 'bob' })} />);
    await screen.findByTestId('order-payment-none');
    // then
    expect(screen.queryByTestId('order-payment-pay-now')).not.toBeInTheDocument();
    unmount();

    renderWithRoute(<OrderPaymentPanel order={orderFixture({ status: 'PAID' })} />);
    await screen.findByTestId('order-payment-none');
    expect(screen.queryByTestId('order-payment-pay-now')).not.toBeInTheDocument();
    expect(screen.queryByTestId('order-payment-awaiting')).not.toBeInTheDocument();
  });

  it('hides "Pay now" when gift card and points cover the order', async () => {
    // given / when
    renderWithRoute(<OrderPaymentPanel order={orderFixture({ amountDue: 0 })} />);
    await screen.findByTestId('order-payment-none');
    // then
    expect(screen.queryByTestId('order-payment-pay-now')).not.toBeInTheDocument();
  });

  it('shows the latest payment with refund details and lists every attempt', async () => {
    // given
    const latest = paymentFixture({ id: 'p2', status: 'PARTIALLY_REFUNDED', refundedAmount: 19.99 });
    const failed = paymentFixture({ id: 'p1', status: 'FAILED', failureCode: 'CARD_DECLINED', cardLast4: '0002' });
    vi.mocked(payments.forOrder).mockResolvedValue(ok([latest, failed]));
    // when
    renderWithRoute(<OrderPaymentPanel order={orderFixture({ status: 'PAID' })} />);
    // then
    expect(await screen.findByTestId('order-payment-status')).toHaveTextContent('Partially refunded');
    expect(screen.getByTestId('order-payment-card')).toHaveTextContent('Visa •••• 4242');
    expect(screen.getByTestId('order-payment-amount')).toHaveTextContent('$59.97');
    expect(screen.getByTestId('order-payment-refunded')).toHaveTextContent('$19.99');
    expect(screen.queryByTestId('order-payment-failure')).not.toBeInTheDocument();
    expect(screen.getByTestId('order-payment-attempt-p1')).toHaveTextContent('Visa •••• 0002');
    expect(screen.getByTestId('order-payment-attempt-status-p1')).toHaveTextContent('Failed');
    expect(screen.getByTestId('order-payment-attempt-status-p2')).toHaveTextContent('Partially refunded');
  });

  it('explains why the latest payment failed', async () => {
    // given
    vi.mocked(payments.forOrder).mockResolvedValue(ok([paymentFixture({ status: 'FAILED', failureCode: 'INSUFFICIENT_FUNDS' })]));
    // when
    renderWithRoute(<OrderPaymentPanel order={orderFixture()} />);
    // then
    expect(await screen.findByTestId('order-payment-failure')).toHaveTextContent('insufficient funds');
    expect(screen.queryByTestId('order-payment-refunded')).not.toBeInTheDocument();
    expect(screen.queryByTestId('order-payment-attempts')).not.toBeInTheDocument();
  });

  it('says so when payment-service cannot be reached', async () => {
    // given
    vi.mocked(payments.forOrder).mockRejectedValue(axiosError(503));
    // when
    renderWithRoute(<OrderPaymentPanel order={orderFixture()} />);
    // then
    expect(await screen.findByTestId('order-payment-unavailable')).toBeInTheDocument();
  });

  it('renders nothing when the build disables payments', () => {
    // given
    vi.mocked(isPaymentEnabled).mockReturnValue(false);
    // when
    renderWithRoute(<OrderPaymentSection order={orderFixture()} />);
    // then
    expect(screen.queryByTestId('order-payment-panel')).not.toBeInTheDocument();
    expect(payments.forOrder).not.toHaveBeenCalled();
  });
});
