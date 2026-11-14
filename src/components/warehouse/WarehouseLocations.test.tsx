import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarehouseLocations } from './WarehouseLocations';
import { warehouse } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../lib/api', () => ({
  warehouse: { locations: vi.fn(), setLocationActive: vi.fn(), reconciliation: vi.fn() },
}));

const KRK = { code: 'KRK', name: 'Krakow Central', city: 'Krakow', active: true, priority: 1, primaryCategories: ['*'], backupCategories: [] };
const GDN = { code: 'GDN', name: 'Gdansk North', city: 'Gdansk', active: true, priority: 2, primaryCategories: ['Books'], backupCategories: ['*'] };

describe('WarehouseLocations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(warehouse.locations).mockResolvedValue({ data: [KRK, GDN] } as never);
    vi.mocked(warehouse.reconciliation).mockResolvedValue({ data: [] } as never);
  });

  it('lists the locations with what they stock', async () => {
    renderWithProviders(<WarehouseLocations />);

    expect(await screen.findByTestId('warehouse-location-name-KRK')).toHaveTextContent('Krakow Central');
    expect(screen.getByTestId('warehouse-location-primary-KRK')).toHaveTextContent('Primary for every other category');
    expect(screen.getByTestId('warehouse-location-backup-KRK')).toHaveTextContent('Backup for —');
    expect(screen.getByTestId('warehouse-location-primary-GDN')).toHaveTextContent('Primary for Books');
    expect(screen.getByTestId('warehouse-location-status-GDN')).toHaveTextContent('ACTIVE');
    expect(screen.getByTestId('warehouse-location-toggle-GDN')).toHaveAttribute('aria-checked', 'true');
  });

  it('deactivates a location and shows its new state', async () => {
    vi.mocked(warehouse.setLocationActive).mockResolvedValue({ data: { ...GDN, active: false } } as never);
    vi.mocked(warehouse.locations).mockResolvedValueOnce({ data: [KRK, GDN] } as never).mockResolvedValue({ data: [KRK, { ...GDN, active: false }] } as never);
    renderWithProviders(<WarehouseLocations />);

    await userEvent.click(await screen.findByTestId('warehouse-location-toggle-GDN'));

    expect(warehouse.setLocationActive).toHaveBeenCalledWith('GDN', false);
    await waitFor(() => expect(screen.getByTestId('warehouse-location-status-GDN')).toHaveTextContent('INACTIVE'));
    expect(screen.getByTestId('warehouse-location-toggle-GDN')).toHaveTextContent('Activate');
  });

  it('shows why a location could not be changed', async () => {
    vi.mocked(warehouse.setLocationActive).mockRejectedValue(Object.assign(new Error('Not found'), {
      isAxiosError: true, response: { status: 404, data: { message: 'Warehouse location not found' } },
    }));
    renderWithProviders(<WarehouseLocations />);

    await userEvent.click(await screen.findByTestId('warehouse-location-toggle-KRK'));

    expect(await screen.findByTestId('warehouse-location-error-KRK')).toHaveTextContent('Warehouse location not found');
  });

  it('says when every order agrees with the backend', async () => {
    renderWithProviders(<WarehouseLocations />);
    expect(await screen.findByTestId('warehouse-reconciliation-empty')).toBeInTheDocument();
  });

  it('lists orders whose parcels disagree with the backend', async () => {
    vi.mocked(warehouse.reconciliation).mockResolvedValue({ data: [{
      orderId: 42, backendState: 'AWAITING_PICK', aggregateState: 'PICKED', lastMirroredState: null,
      parcels: [{ shipmentId: 7, locationCode: 'KRK', status: 'PICKED' }, { shipmentId: 8, locationCode: 'GDN', status: 'PACKED' }],
    }] } as never);
    renderWithProviders(<WarehouseLocations />);

    expect(await screen.findByTestId('warehouse-reconciliation-backend-42')).toHaveTextContent('AWAITING_PICK');
    expect(screen.getByTestId('warehouse-reconciliation-expected-42')).toHaveTextContent('PICKED');
    expect(screen.getByTestId('warehouse-reconciliation-parcels-42')).toHaveTextContent('#7 KRK PICKED, #8 GDN PACKED');
    expect(screen.getByTestId('warehouse-reconciliation-order-42')).toHaveAttribute('href', '/orders/42');
  });

  it('reports a backend outage during reconciliation', async () => {
    vi.mocked(warehouse.reconciliation).mockRejectedValue(Object.assign(new Error('Unavailable'), {
      isAxiosError: true, response: { status: 503, data: { message: 'Backend unavailable' } },
    }));
    renderWithProviders(<WarehouseLocations />);

    expect(await screen.findByTestId('warehouse-reconciliation-error')).toHaveTextContent('Backend unavailable');
  });
});
