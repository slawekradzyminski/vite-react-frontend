import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarehouseBoard } from './WarehouseBoard';
import { tracking, warehouse } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../lib/api', () => ({
  warehouse: {
    queue: vi.fn(), shipments: vi.fn(), create: vi.fn(), pickList: vi.fn(),
    pick: vi.fn(), pack: vi.fn(), ship: vi.fn(), deliver: vi.fn(), cancel: vi.fn(),
    locations: vi.fn(), reallocate: vi.fn(), shortPick: vi.fn(),
  },
  tracking: { byNumber: vi.fn(), advance: vi.fn() },
}));

const page = <T,>(content: T[]) => ({ data: { content, totalElements: content.length, totalPages: 1, pageNumber: 0, pageSize: 20 } });
const shipment = (status: string) => ({ id: 7, orderId: 42, username: 'client', status, totalUnits: 2, lastActor: 'warehouse' });

describe('WarehouseBoard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(warehouse.locations).mockResolvedValue({ data: [
      { code: 'KRK', name: 'Krakow Central', city: 'Krakow', active: true, priority: 1, primaryCategories: ['*'], backupCategories: [] },
      { code: 'GDN', name: 'Gdansk North', city: 'Gdansk', active: true, priority: 2, primaryCategories: ['Books'], backupCategories: ['*'] },
      { code: 'WAW', name: 'Warsaw East', city: 'Warsaw', active: false, priority: 3, primaryCategories: [], backupCategories: [] },
    ] } as never);
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

  it('hands a parcel to the simulated carrier without a tracking number', async () => {
    // given
    vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.shipments).mockResolvedValue(page([shipment('PACKED')]) as never);
    vi.mocked(warehouse.ship).mockResolvedValue({ data: { ...shipment('SHIPPED'), carrier: 'DPD', trackingNumber: '12345678901234' } } as never);
    renderWithProviders(<WarehouseBoard />);
    await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));

    // when
    await userEvent.selectOptions(screen.getByTestId('warehouse-carrier-7'), 'DPD');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Simulated carrier (auto tracking number)' }));
    await userEvent.click(screen.getByTestId('warehouse-ship-7'));

    // then
    expect(screen.queryByTestId('warehouse-tracking-7')).not.toBeInTheDocument();
    expect(warehouse.ship).toHaveBeenCalledWith(7, 'DPD');
    expect(await screen.findByTestId('warehouse-notice')).toHaveTextContent('Shipment #7 is now SHIPPED');
  });

  it('advances a simulated carrier by one scan', async () => {
    // given
    vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.shipments).mockResolvedValue(page([{ ...shipment('SHIPPED'), carrier: 'DHL', trackingNumber: '1234567890' }]) as never);
    vi.mocked(tracking.byNumber).mockResolvedValue({ data: { simulated: true, currentStatus: 'IN_TRANSIT', trackingNumber: '1234567890' } } as never);
    vi.mocked(tracking.advance).mockResolvedValue({ data: { simulated: true, currentStatus: 'OUT_FOR_DELIVERY' } } as never);
    renderWithProviders(<WarehouseBoard />);
    await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
    expect(await screen.findByTestId('warehouse-carrier-status-7')).toHaveTextContent('Simulated carrier · In transit');

    // when
    await userEvent.click(screen.getByTestId('warehouse-advance-7'));

    // then
    expect(tracking.byNumber).toHaveBeenCalledWith('1234567890');
    expect(tracking.advance).toHaveBeenCalledWith(7);
    expect(await screen.findByTestId('warehouse-notice')).toHaveTextContent('Shipment #7 carrier status: Out for delivery');
    expect(screen.getByTestId('warehouse-carrier-status-7')).toHaveTextContent('Out for delivery');
  });

  it('offers no carrier advance for a manually tracked parcel and reports advance failures', async () => {
    // given a manual parcel
    vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    vi.mocked(warehouse.shipments).mockResolvedValue(page([{ ...shipment('SHIPPED'), carrier: 'DHL', trackingNumber: '1234567890' }]) as never);
    vi.mocked(tracking.byNumber).mockResolvedValue({ data: { simulated: false, currentStatus: 'IN_TRANSIT' } } as never);
    const { unmount } = renderWithProviders(<WarehouseBoard />);
    await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
    await waitFor(() => expect(tracking.byNumber).toHaveBeenCalled());

    // then
    expect(screen.queryByTestId('warehouse-advance-7')).not.toBeInTheDocument();
    expect(screen.getByTestId('warehouse-deliver-7')).toBeInTheDocument();
    unmount();
  });
  describe('split shipments', () => {
    const parcel = (overrides: Record<string, unknown> = {}) => ({
      ...shipment('AWAITING_PICK'), locationCode: 'KRK', locationName: 'Krakow Central', parcelIndex: 1, parcelCount: 2,
      lines: [
        { productId: 3, productName: 'Phone', category: 'Electronics', quantity: 2 },
        { productId: 4, productName: 'Cable', category: 'Accessories', quantity: 1 },
      ],
      ...overrides,
    });

    beforeEach(() => {
      vi.mocked(warehouse.queue).mockResolvedValue(page([]) as never);
    });

    it('says how many parcels a released order became', async () => {
      vi.mocked(warehouse.queue).mockResolvedValue(page([{ id: 42, username: 'client', items: [{ quantity: 3 }], totalAmount: 20, createdAt: '2026-11-08T10:00:00' }]) as never);
      vi.mocked(warehouse.shipments).mockResolvedValue(page([]) as never);
      vi.mocked(warehouse.create).mockResolvedValue({ data: { id: 7, orderId: 42, parcelCount: 2 } } as never);
      renderWithProviders(<WarehouseBoard />);

      await userEvent.click(await screen.findByTestId('warehouse-release-42'));

      expect(await screen.findByTestId('warehouse-notice')).toHaveTextContent('Order #42 released in 2 parcels, first shipment #7');
    });

    it('shows where each parcel ships from', async () => {
      vi.mocked(warehouse.shipments).mockResolvedValue(page([parcel(), parcel({ id: 8, locationCode: 'GDN', locationName: 'Gdansk North', parcelIndex: 2 }), { ...shipment('PICKED'), id: 9, locationCode: 'KRK', parcelCount: 1 }]) as never);
      renderWithProviders(<WarehouseBoard />);

      expect(await screen.findByTestId('warehouse-shipment-location-7')).toHaveTextContent('KRK · parcel 1/2');
      expect(screen.getByTestId('warehouse-shipment-location-8')).toHaveTextContent('GDN · parcel 2/2');
      expect(screen.getByTestId('warehouse-shipment-location-9')).toHaveTextContent(/^KRK$/);
      await userEvent.click(screen.getByTestId('warehouse-shipment-8'));
      expect(screen.getByTestId('warehouse-selected-location')).toHaveTextContent('Ships from Gdansk North (GDN) · parcel 2 of 2');
    });

    it('reallocates an awaiting parcel to the best other location or a chosen active one', async () => {
      vi.mocked(warehouse.shipments).mockResolvedValue(page([parcel()]) as never);
      vi.mocked(warehouse.reallocate).mockResolvedValue({ data: parcel({ id: 8, locationCode: 'GDN', locationName: 'Gdansk North' }) } as never);
      renderWithProviders(<WarehouseBoard />);

      await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
      const target = screen.getByTestId('warehouse-reallocate-target-7');
      await waitFor(() => expect(target.querySelectorAll('option')).toHaveLength(2));
      expect(target).toHaveTextContent('Gdansk North (GDN)');
      expect(target).not.toHaveTextContent('Krakow Central');
      expect(target).not.toHaveTextContent('Warsaw East');
      await userEvent.click(screen.getByTestId('warehouse-reallocate-7'));

      expect(warehouse.reallocate).toHaveBeenCalledWith(7, undefined);
      expect(await screen.findByTestId('warehouse-notice')).toHaveTextContent('Parcel lines now ship from Gdansk North (GDN) in shipment #8');

      await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
      await userEvent.selectOptions(screen.getByTestId('warehouse-reallocate-target-7'), 'GDN');
      await userEvent.click(screen.getByTestId('warehouse-reallocate-7'));
      expect(warehouse.reallocate).toHaveBeenLastCalledWith(7, 'GDN');
    });

    it('reports a short pick of one product and shows a refusal', async () => {
      vi.mocked(warehouse.shipments).mockResolvedValue(page([parcel()]) as never);
      vi.mocked(warehouse.shortPick).mockRejectedValueOnce(Object.assign(new Error('Conflict'), {
        isAxiosError: true, response: { status: 409, data: { message: 'No other active location stocks Accessories' } },
      }));
      renderWithProviders(<WarehouseBoard />);

      await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
      await userEvent.selectOptions(screen.getByTestId('warehouse-short-pick-product-7'), '4');
      await userEvent.click(screen.getByTestId('warehouse-short-pick-7'));

      expect(warehouse.shortPick).toHaveBeenCalledWith(7, { productId: 4, missingQuantity: 1 });
      expect(await screen.findByTestId('warehouse-parcel-error-7')).toHaveTextContent('No other active location stocks Accessories');
    });

    it('does not report more missing units than the line holds', async () => {
      vi.mocked(warehouse.shipments).mockResolvedValue(page([parcel()]) as never);
      renderWithProviders(<WarehouseBoard />);

      await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
      const quantity = screen.getByTestId('warehouse-short-pick-quantity-7');
      await userEvent.clear(quantity);
      await userEvent.type(quantity, '3');
      expect(screen.getByTestId('warehouse-short-pick-7')).toBeDisabled();
      await userEvent.clear(quantity);
      await userEvent.type(quantity, '0');
      expect(screen.getByTestId('warehouse-short-pick-7')).toBeDisabled();
      await userEvent.clear(quantity);
      await userEvent.type(quantity, '2');
      expect(screen.getByTestId('warehouse-short-pick-7')).toBeEnabled();
    });

    it('offers no parcel moves once picking started', async () => {
      vi.mocked(warehouse.shipments).mockResolvedValue(page([parcel({ status: 'PICKED' })]) as never);
      renderWithProviders(<WarehouseBoard />);

      await userEvent.click(await screen.findByTestId('warehouse-shipment-7'));
      expect(screen.queryByTestId('warehouse-parcel-admin-7')).not.toBeInTheDocument();
    });
  });
});
