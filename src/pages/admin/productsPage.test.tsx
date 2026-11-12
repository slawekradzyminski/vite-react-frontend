import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui/ToastProvider';
import { AdminProductsPage } from './productsPage';

vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  products: { getAllProducts: vi.fn().mockResolvedValue({ data: [] }), deleteProduct: vi.fn() },
}));

describe('AdminProductsPage', () => {
  it('shows the confirmation the product form hands over (T-063)', async () => {
    // given
    const toast = { variant: 'success', title: 'Product created', description: 'The product is now in the catalogue.' };

    // when
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[{ pathname: '/admin/products', state: { toast } }]}>
          <ToastProvider><AdminProductsPage /></ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // then
    expect(await screen.findByText('Product created')).toBeInTheDocument();
    expect(screen.getByText('The product is now in the catalogue.')).toBeInTheDocument();
  });
});
