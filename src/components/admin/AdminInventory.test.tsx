import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventory } from '../../lib/api';
import type { InventoryItem, InventoryMovement, PageDto } from '../../types/inventory';
import { AdminInventory } from './AdminInventory';

vi.mock('../../lib/api', () => ({
  inventory: {
    list: vi.fn(),
    get: vi.fn(),
    adjust: vi.fn(),
    movements: vi.fn(),
  },
}));

const inventoryItems: InventoryItem[] = [
  {
    productId: 1,
    name: 'USB-C Cable',
    category: 'Accessories',
    availableQuantity: 3,
    stockStatus: 'LOW_STOCK',
    lastChangedAt: '2026-08-16T10:00:00Z',
  },
  {
    productId: 2,
    name: 'Mechanical Keyboard',
    category: 'Keyboards',
    availableQuantity: 12,
    stockStatus: 'IN_STOCK',
    lastChangedAt: '2026-08-16T11:00:00Z',
  },
];

const inventoryPage = (content = inventoryItems): PageDto<InventoryItem> => ({
  content,
  pageNumber: 0,
  pageSize: 20,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
});

const movementPage: PageDto<InventoryMovement> = {
  content: [
    {
      id: 8,
      productId: 1,
      type: 'ADMIN_ADJUSTMENT',
      delta: -2,
      quantityAfter: 3,
      actor: 'admin',
      reason: 'Damaged item',
      requestId: 'movement-request',
      createdAt: '2026-08-16T10:05:00Z',
    },
  ],
  pageNumber: 0,
  pageSize: 20,
  totalElements: 1,
  totalPages: 1,
};

function LocationProbe() {
  return <output data-testid="location-probe">{useLocation().pathname}</output>;
}

function renderInventory(initialEntry = '/admin/inventory') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <Routes>
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/inventory/:productId" element={<AdminInventory />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { ...result, invalidateSpy };
}

describe('AdminInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventory.list).mockResolvedValue({ data: inventoryPage() } as never);
    vi.mocked(inventory.get).mockImplementation(async (productId) => ({
      data: inventoryItems.find((item) => item.productId === productId) ?? inventoryItems[0],
    }) as never);
    vi.mocked(inventory.movements).mockResolvedValue({ data: movementPage } as never);
    vi.mocked(inventory.adjust).mockResolvedValue({ data: movementPage.content[0] } as never);
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValue('22222222-2222-4222-8222-222222222222');
  });

  it('renders the paged ledger and sends exact backend filters with a minimum threshold of one', async () => {
    const user = userEvent.setup();
    renderInventory();

    expect(await screen.findByText('USB-C Cable')).toBeInTheDocument();
    expect(screen.getAllByText('Low stock')).toHaveLength(2);
    expect(screen.getByTestId('inventory-result-count')).toHaveTextContent('2 products');

    await user.clear(screen.getByLabelText('Category'));
    await user.type(screen.getByLabelText('Category'), 'Warehouse-only');
    await user.clear(screen.getByLabelText('Low-stock threshold'));
    await user.type(screen.getByLabelText('Low-stock threshold'), '0');
    await user.tab();

    expect(screen.getByLabelText('Low-stock threshold')).toHaveValue(1);
    await waitFor(() => {
      expect(inventory.list).toHaveBeenLastCalledWith(expect.objectContaining({
        page: 0,
        size: 20,
        category: 'Warehouse-only',
        lowStockThreshold: 1,
      }));
    });
  });

  it('selects a row through the route and refreshes movement history on demand', async () => {
    const user = userEvent.setup();
    renderInventory();

    await user.click(await screen.findByTestId('inventory-row-1'));

    expect(await screen.findByRole('heading', { name: 'USB-C Cable' })).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/admin/inventory/1');
    expect(await screen.findByText('Damaged item', { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(inventory.movements).toHaveBeenCalledTimes(2));
  });

  it('rejects invalid route ids without calling product-specific APIs', async () => {
    renderInventory('/admin/inventory/not-a-number');

    expect(await screen.findByTestId('inventory-invalid-selection')).toHaveTextContent('Invalid product selection');
    expect(inventory.get).not.toHaveBeenCalled();
    expect(inventory.movements).not.toHaveBeenCalled();
  });

  it('shows explicit list and detail failures', async () => {
    vi.mocked(inventory.list).mockRejectedValueOnce(new Error('list unavailable'));
    const firstRender = renderInventory();

    expect(await screen.findByTestId('inventory-list-error')).toHaveTextContent('Unable to load inventory');
    firstRender.unmount();

    vi.mocked(inventory.list).mockResolvedValue({ data: inventoryPage() } as never);
    vi.mocked(inventory.get).mockRejectedValueOnce(new Error('missing'));
    renderInventory('/admin/inventory/1');

    expect(await screen.findByTestId('inventory-detail-error')).toHaveTextContent('Unable to load this product');
  });

  it('validates adjustments and preserves the request id across a failed retry', async () => {
    const user = userEvent.setup();
    const conflict = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: { status: 409 },
    });
    vi.mocked(inventory.adjust)
      .mockRejectedValueOnce(conflict)
      .mockResolvedValue({ data: movementPage.content[0] } as never);
    const { invalidateSpy } = renderInventory('/admin/inventory/1');

    const applyButton = await screen.findByRole('button', { name: 'Apply adjustment' });
    expect(applyButton).toBeDisabled();

    await user.type(screen.getByLabelText('Quantity change'), '-2');
    await user.type(screen.getByLabelText('Reason'), 'Damaged item');
    await user.click(applyButton);

    expect(await screen.findByTestId('inventory-adjustment-error')).toHaveTextContent('conflicts with the current inventory state');
    const firstRequest = vi.mocked(inventory.adjust).mock.calls[0][1];
    expect(firstRequest).toEqual({
      delta: -2,
      reason: 'Damaged item',
      requestId: '11111111-1111-4111-8111-111111111111',
    });

    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }));
    await waitFor(() => expect(inventory.adjust).toHaveBeenCalledTimes(2));
    expect(vi.mocked(inventory.adjust).mock.calls[1][1].requestId).toBe(firstRequest.requestId);
    await waitFor(() => expect(screen.getByLabelText('Quantity change')).toHaveValue(''));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });

    await user.type(screen.getByLabelText('Quantity change'), '4');
    await user.type(screen.getByLabelText('Reason'), 'Restocked');
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }));
    await waitFor(() => expect(inventory.adjust).toHaveBeenCalledTimes(3));
    expect(vi.mocked(inventory.adjust).mock.calls[2][1].requestId).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('clears adjustment intent and rotates its request id when the selected product changes', async () => {
    const user = userEvent.setup();
    renderInventory('/admin/inventory/1');

    await screen.findByRole('heading', { name: 'USB-C Cable' });
    await user.type(screen.getByLabelText('Quantity change'), '3');
    await user.type(screen.getByLabelText('Reason'), 'First intent');
    await user.click(screen.getByTestId('inventory-row-2'));

    expect(await screen.findByRole('heading', { name: 'Mechanical Keyboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity change')).toHaveValue('');
    expect(screen.getByLabelText('Reason')).toHaveValue('');

    await user.type(screen.getByLabelText('Quantity change'), '2');
    await user.type(screen.getByLabelText('Reason'), 'Second intent');
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }));

    await waitFor(() => expect(inventory.adjust).toHaveBeenCalledWith(2, expect.objectContaining({
      requestId: '22222222-2222-4222-8222-222222222222',
    })));
  });
});
