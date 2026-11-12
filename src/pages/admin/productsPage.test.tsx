import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui/ToastProvider';
import { AdminProductsPage } from './productsPage';
import { AdminProductFormPage } from './productFormPage';

vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  products: { getAllProducts: vi.fn().mockResolvedValue({ data: [] }), deleteProduct: vi.fn() },
}));

vi.mock('../../components/products/AdminProductForm', () => ({
  AdminProductForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={onSuccess} data-testid="admin-product-form-mock-save">Save</button>
  ),
}));

describe('AdminProductsPage', () => {
  it('shows the confirmation of the product form it returns from (T-063)', async () => {
    // given
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/admin/products/new']}>
          <ToastProvider>
            <Routes>
              <Route path="/admin/products/new" element={<AdminProductFormPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
            </Routes>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // when
    fireEvent.click(screen.getByTestId('admin-product-form-mock-save'));

    // then
    expect(await screen.findByTestId('admin-products-page')).toBeInTheDocument();
    expect(screen.getByText('Product created')).toBeInTheDocument();
    expect(screen.getByText('The product is now in the catalogue.')).toBeInTheDocument();
  });
});
