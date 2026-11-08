import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartCouponPanel } from './CartCouponPanel';
import { cartCoupon } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../lib/api', () => ({
  cartCoupon: { summary: vi.fn(), apply: vi.fn(), remove: vi.fn() },
}));

const rejection = (status: number, message: string) =>
  Object.assign(new Error('Request failed'), { isAxiosError: true, response: { status, data: { message } } });

describe('CartCouponPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('applies a trimmed code and shows the previewed discount', async () => {
    vi.mocked(cartCoupon.summary)
      .mockResolvedValueOnce({ data: { couponCode: null } } as never)
      .mockResolvedValue({ data: { couponCode: 'WELCOME10', couponValid: true, discountAmount: 10, totalAfterDiscount: 89.99 } } as never);
    vi.mocked(cartCoupon.apply).mockResolvedValue({ data: {} } as never);
    renderWithProviders(<CartCouponPanel />);

    await userEvent.type(await screen.findByTestId('cart-coupon-input'), '  welcome10 ');
    await userEvent.click(screen.getByTestId('cart-coupon-apply'));

    expect(cartCoupon.apply).toHaveBeenCalledWith('welcome10');
    expect(await screen.findByTestId('cart-coupon-discount')).toHaveTextContent('−$10.00');
    expect(screen.getByTestId('cart-coupon-total-after')).toHaveTextContent('$89.99');
  });

  it('shows the backend reason when a coupon is rejected', async () => {
    vi.mocked(cartCoupon.summary).mockResolvedValue({ data: { couponCode: null } } as never);
    vi.mocked(cartCoupon.apply).mockRejectedValue(rejection(409, 'Coupon usage limit reached'));
    renderWithProviders(<CartCouponPanel />);

    await userEvent.type(await screen.findByTestId('cart-coupon-input'), 'FIRST1');
    await userEvent.click(screen.getByTestId('cart-coupon-apply'));

    expect(await screen.findByTestId('cart-coupon-error')).toHaveTextContent('Coupon usage limit reached');
  });

  it('explains why an applied coupon no longer qualifies and lets the user remove it', async () => {
    vi.mocked(cartCoupon.summary).mockResolvedValue({
      data: { couponCode: 'MIN100', couponValid: false, couponMessage: 'Order subtotal must be at least 100.00', discountAmount: 0 },
    } as never);
    vi.mocked(cartCoupon.remove).mockResolvedValue({ data: {} } as never);
    renderWithProviders(<CartCouponPanel />);

    expect(await screen.findByTestId('cart-coupon-invalid')).toHaveTextContent('Order subtotal must be at least 100.00');
    expect(screen.queryByTestId('cart-coupon-discount')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('cart-coupon-remove'));
    await waitFor(() => expect(cartCoupon.remove).toHaveBeenCalled());
  });
});
