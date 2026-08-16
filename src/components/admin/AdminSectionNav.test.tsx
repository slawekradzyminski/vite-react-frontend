import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AdminSectionNav } from './AdminSectionNav';

describe('AdminSectionNav', () => {
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
