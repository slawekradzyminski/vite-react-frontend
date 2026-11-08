import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarehouseBoard } from './WarehouseBoard';
import { warehouse } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../lib/api', () => ({
  warehouse: {
    queue: vi.fn(), shipments: vi.fn(), create: vi.fn(), pickList: vi.fn(),
    pick: vi.fn(), pack: vi.fn(), ship: vi.fn(), deliver: vi.fn(), cancel: vi.fn(),
  },
}));

const page = <T,>(content: T[]) => ({ data: { content, totalElements: content.length, totalPages: 1, pageNumber: 0, pageSize: 20 } });
const shipment = (status: string) => ({ id: 7, orderId: 42, username: 'client', status, totalUnits: 2, lastActor: 'warehouse' });

describe('WarehouseBoard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(warehouse.pickList).mockResolvedValue({ data: { totalUnits: 2, items: [{ productId: 3, productName: 'Phone', category: 'Electronics', quantity: 2 }] } } as never);
  });

  it('releases a paid order from the queue', async () => {
    vi.mocked(warehouse.queue).mockResolvedValue(page([{ id: 42, username: 'client', items: [{ quantity: 2 }], totalAmount: 20, createdAt: '2026-11-08T10:00:00' }]) as never);
    vi.mocked(warehouse.shipments).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.create).mockResolvedValue({ data: { id: 7, orderId: 42 } } as never);
    renderWithProviders(<WarehouseBoard />);

    await userEvent.click(await screen.findByTestId('warehouse-release-42'));

    expect(warehouse.create).toHaveBeenCalledWith(42);
    expect(await screen.findByTestId('warehouse-notice')).toHaveTextContent('Order #42 released as shipment #7');
  });

  it('blocks an invalid tracking number before calling the backend', async () => {
    vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.shipments).mockResolvedValue(page([shipment('PACKED')]) as never);
    renderWithProviders(<WarehouseBoard />);

    await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
    await userEvent.selectOptions(screen.getByTestId('warehouse-carrier-7'), 'INPOST');
    await userEvent.type(screen.getByTestId('warehouse-tracking-7'), '1234567890');
    await userEvent.click(screen.getByTestId('warehouse-ship-7'));

    expect(screen.getByTestId('warehouse-tracking-error-7')).toHaveTextContent('INPOST tracking numbers are 24 digits.');
    expect(warehouse.ship).not.toHaveBeenCalled();
  });

  it('follows a shipment to its new status after a transition', async () => {
    vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.shipments).mockImplementation(((status?: string) =>
      Promise.resolve(page(status === 'PICKED' ? [shipment('PICKED')] : [shipment('AWAITING_PICK')]))) as never);
    vi.mocked(warehouse.pick).mockResolvedValue({ data: shipment('PICKED') } as never);
    renderWithProviders(<WarehouseBoard />);

    await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
    await userEvent.click(screen.getByTestId('warehouse-pick-7'));

    await waitFor(() => expect(screen.getByTestId('warehouse-filter')).toHaveValue('PICKED'));
    expect(await screen.findByTestId('warehouse-notice')).toHaveTextContent('Shipment #7 is now PICKED');
  });

  it('shows the conflict reason when the backend rejects a transition', async () => {
    vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.shipments).mockResolvedValue(page([shipment('AWAITING_PICK')]) as never);
    vi.mocked(warehouse.pick).mockRejectedValue(Object.assign(new Error('Conflict'), {
      isAxiosError: true, response: { status: 409, data: { message: 'Cannot pick a shipment in status CANCELLED' } },
    }));
    renderWithProviders(<WarehouseBoard />);

    await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
    await userEvent.click(screen.getByTestId('warehouse-pick-7'));

    expect(await screen.findByTestId('warehouse-error-7')).toHaveTextContent('Cannot pick a shipment in status CANCELLED');
  });
});
