import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminSectionNav } from './AdminSectionNav';

describe('AdminSectionNav', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const renderAt = (path: string) => render(
    <MemoryRouter initialEntries={[path]}>
      <AdminSectionNav />
    </MemoryRouter>
  );

  it('hides the returns and purchasing tabs when a build disables warehouse-service', () => {
    vi.stubEnv('VITE_WAREHOUSE_ENABLED', 'false');
    renderAt('/admin');

    expect(screen.getByTestId('admin-section-coupons')).toHaveAttribute('href', '/admin/coupons');
    expect(screen.getByTestId('admin-section-reviews')).toHaveAttribute('href', '/admin/reviews');
    expect(screen.queryByTestId('admin-section-returns')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-section-purchasing')).not.toBeInTheDocument();
  });

  it('shows the returns and purchasing tabs by default', () => {
    renderAt('/admin');

    expect(screen.getByTestId('admin-section-returns')).toHaveAttribute('href', '/admin/returns');
    expect(screen.getByTestId('admin-section-purchasing')).toHaveAttribute('href', '/admin/purchasing');
  });

  it('exposes inventory only inside the admin section and marks the active route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/inventory/42']}>
        <AdminSectionNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Admin sections' })).toBeInTheDocument();
    expect(screen.getByTestId('admin-section-overview')).toHaveAttribute('href', '/admin');
    expect(screen.getByTestId('admin-section-products')).toHaveAttribute('href', '/admin/products');
    expect(screen.getByTestId('admin-section-orders')).toHaveAttribute('href', '/admin/orders');
    expect(screen.getByTestId('admin-section-inventory')).toHaveAttribute('href', '/admin/inventory');
    expect(screen.getByTestId('admin-section-inventory')).toHaveAttribute('aria-current', 'page');
  });
});
