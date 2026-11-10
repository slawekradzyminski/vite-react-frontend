import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { orders, products } from '../../lib/api';
import { AdminDashboard } from './AdminDashboard';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  orders: { getAllOrders: vi.fn() },
  products: { getAllProducts: vi.fn() },
}));

describe('AdminDashboard commerce settings links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(products.getAllProducts).mockResolvedValue({ data: [] } as never);
    vi.mocked(orders.getAllOrders).mockResolvedValue({ data: { content: [], totalPages: 0, totalElements: 0 } } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('links to gift cards, VAT rates, currencies, payments and webhooks', async () => {
    // given / when
    renderWithQuery(<AdminDashboard />);

    // then
    expect(await screen.findByRole('heading', { name: 'Commerce settings' })).toBeInTheDocument();
    expect(screen.getByTestId('admin-dashboard-gift-cards-link')).toHaveAttribute('href', '/admin/gift-cards');
    expect(screen.getByTestId('admin-dashboard-vat-rates-link')).toHaveAttribute('href', '/admin/vat-rates');
    expect(screen.getByTestId('admin-dashboard-currencies-link')).toHaveAttribute('href', '/admin/currencies');
    expect(screen.getByTestId('admin-dashboard-payments-link')).toHaveAttribute('href', '/admin/payments');
    expect(screen.getByTestId('admin-dashboard-webhooks-link')).toHaveAttribute('href', '/admin/webhooks');
  });

  it('hides the payments link when a build disables payment-service', async () => {
    // given
    vi.stubEnv('VITE_PAYMENT_ENABLED', 'false');

    // when
    renderWithQuery(<AdminDashboard />);

    // then
    expect(await screen.findByTestId('admin-dashboard-webhooks-link')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-dashboard-payments-link')).not.toBeInTheDocument();
  });
});
