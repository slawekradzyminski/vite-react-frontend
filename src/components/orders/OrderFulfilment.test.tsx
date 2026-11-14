import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderFulfilment } from './OrderFulfilment';
import { returns, tracking, warehouse } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import type { Order } from '../../types/order';
import type { Shipment } from '../../types/commerce';

vi.mock('../../lib/api', () => ({
  warehouse: { parcels: vi.fn() },
  returns: { create: vi.fn() },
  tracking: { byNumber: vi.fn() },
}));

const order = (status: Order['status'], fulfilmentState?: Order['fulfilmentState'], id = 42): Order => ({
  id, username: 'client', status, fulfilmentState, totalAmount: 140, createdAt: '', updatedAt: '',
  shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'MZ', zipCode: '00-001', country: 'PL' },
  items: [
    { id: 1, productId: 3, productName: 'Phone', quantity: 1, unitPrice: 100, totalPrice: 100 },
    { id: 2, productId: 4, productName: 'Cable', quantity: 2, unitPrice: 20, totalPrice: 40 },
  ],
});

const parcel = (overrides: Partial<Shipment> = {}): Shipment => ({
  id: 7, orderId: 42, status: 'AWAITING_PICK', locationCode: 'KRK', locationName: 'Krakow Central', parcelIndex: 1, parcelCount: 1,
  lines: [{ productId: 3, productName: 'Phone', category: 'Electronics', quantity: 1 }],
  ...overrides,
});

const parcels = (...list: Shipment[]) => vi.mocked(warehouse.parcels).mockResolvedValue({ data: list } as never);

describe('OrderFulfilment', () => {
  beforeEach(() => vi.resetAllMocks());

  it('says the order is not released when warehouse-service lists no parcels', async () => {
    parcels();
    renderWithProviders(<OrderFulfilment order={order('PAID')} />);

    expect(await screen.findByTestId('order-shipment-none')).toBeInTheDocument();
    expect(warehouse.parcels).toHaveBeenCalledWith(42);
    expect(screen.queryByTestId('order-shipment')).not.toBeInTheDocument();
    expect(screen.queryByTestId('order-return-open')).not.toBeInTheDocument();
  });

  it('treats a 404 for the parcels as not released', async () => {
    vi.mocked(warehouse.parcels).mockRejectedValue(Object.assign(new Error('Not found'), { isAxiosError: true, response: { status: 404 } }));
    renderWithProviders(<OrderFulfilment order={order('PAID', undefined, 50)} />);

    expect(await screen.findByTestId('order-shipment-none')).toBeInTheDocument();
    expect(screen.queryByTestId('order-shipment-unavailable')).not.toBeInTheDocument();
  });

  it('says when the parcels cannot be loaded for another reason', async () => {
    vi.mocked(warehouse.parcels).mockRejectedValue(Object.assign(new Error('Unavailable'), { isAxiosError: true, response: { status: 503 } }));
    renderWithProviders(<OrderFulfilment order={order('PAID', 'PICKED', 51)} />);

    expect(await screen.findByTestId('order-shipment-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('order-shipment-none')).not.toBeInTheDocument();
  });

  it('skips the parcels request when the order says it has not reached the warehouse', async () => {
    renderWithProviders(<OrderFulfilment order={order('PAID', 'NONE')} />);

    expect(screen.getByTestId('order-shipment-none')).toBeInTheDocument();
    expect(screen.queryByTestId('order-shipment-loading')).not.toBeInTheDocument();
    expect(warehouse.parcels).not.toHaveBeenCalled();
  });

  it('shows each parcel with its location, lines and progress', async () => {
    parcels(
      parcel({ id: 7, status: 'PICKED', parcelIndex: 1, parcelCount: 2 }),
      parcel({
        id: 8, status: 'AWAITING_PICK', parcelIndex: 2, parcelCount: 2, locationCode: 'GDN', locationName: 'Gdansk North',
        lines: [{ productId: 4, productName: 'Cable', category: 'Accessories', quantity: 2 }],
      }),
    );
    renderWithProviders(<OrderFulfilment order={order('PAID', 'AWAITING_PICK', 52)} />);

    const first = await screen.findByTestId('parcel-1');
    const second = screen.getByTestId('parcel-2');
    expect(screen.getByTestId('order-parcel-count')).toHaveTextContent('2 parcels');
    expect(within(first).getByTestId('parcel-1-title')).toHaveTextContent('Parcel 1 of 2');
    expect(within(first).getByTestId('parcel-1-location')).toHaveTextContent('Ships from Krakow Central (KRK)');
    expect(within(first).getByTestId('parcel-1-status')).toHaveTextContent(/picked/i);
    expect(within(first).getByTestId('parcel-1-line-3')).toHaveTextContent('Phone× 1');
    expect(within(first).getByTestId('parcel-1-step-picked').className).toContain('bg-slate-900');
    expect(within(first).getByTestId('parcel-1-step-packed').className).not.toContain('bg-slate-900');
    expect(within(second).getByTestId('parcel-2-location')).toHaveTextContent('Ships from Gdansk North (GDN)');
    expect(within(second).getByTestId('parcel-2-line-4')).toHaveTextContent('Cable× 2');
    expect(within(second).getByTestId('parcel-2-step-awaiting_pick').className).toContain('bg-slate-900');
    expect(within(second).getByTestId('parcel-2-step-picked').className).not.toContain('bg-slate-900');
    expect(tracking.byNumber).not.toHaveBeenCalled();
  });

  it('numbers parcels by position when warehouse-service sends no index and hides steps of a cancelled parcel', async () => {
    parcels(parcel({ id: 9, status: 'CANCELLED', parcelIndex: undefined, parcelCount: undefined, locationName: undefined, locationCode: 'KRK' }));
    renderWithProviders(<OrderFulfilment order={order('CANCELLED', 'CANCELLED', 53)} />);

    expect(await screen.findByTestId('parcel-1-title')).toHaveTextContent('Parcel 1 of 1');
    expect(screen.getByTestId('parcel-1-location')).toHaveTextContent('Ships from KRK');
    expect(screen.queryByTestId('parcel-1-steps')).not.toBeInTheDocument();
    expect(screen.queryByTestId('order-parcel-count')).not.toBeInTheDocument();
  });

  it('shows the carrier timeline of each shipped parcel by its tracking number', async () => {
    // given
    parcels(
      parcel({ id: 7, status: 'SHIPPED', carrier: 'DHL', trackingNumber: '1234567890', parcelIndex: 1, parcelCount: 2 }),
      parcel({ id: 8, status: 'PACKED', parcelIndex: 2, parcelCount: 2, locationCode: 'GDN' }),
    );
    vi.mocked(tracking.byNumber).mockResolvedValue({ data: {
      carrier: 'DHL', trackingNumber: '1234567890', currentStatus: 'DELIVERY_FAILED',
      events: [{ status: 'DELIVERY_FAILED', location: 'Berlin', description: 'Nobody home', occurredAt: '2026-11-11T09:00:00' }],
    } } as never);

    // when
    renderWithProviders(<OrderFulfilment order={order('SHIPPED', 'SHIPPED', 54)} />);

    // then
    const first = await screen.findByTestId('parcel-1-tracking');
    expect(within(first).getByTestId('tracking-current-status')).toHaveTextContent('Delivery attempt failed');
    expect(screen.getByTestId('parcel-1-tracking-number')).toHaveTextContent('DHL · 1234567890');
    expect(tracking.byNumber).toHaveBeenCalledTimes(1);
    expect(tracking.byNumber).toHaveBeenCalledWith('1234567890');
    expect(screen.queryByTestId('parcel-2-tracking')).not.toBeInTheDocument();
  });

  it('shows the delivery and requests a return with only the selected quantities', async () => {
    parcels(parcel({ id: 7, status: 'DELIVERED', deliveredAt: '2026-11-08T10:00:00' }));
    vi.mocked(tracking.byNumber).mockRejectedValue(new Error('no number'));
    vi.mocked(returns.create).mockResolvedValue({ data: { id: 5 } } as never);
    renderWithProviders(<OrderFulfilment order={order('DELIVERED', undefined, 55)} />);

    expect(await screen.findByTestId('parcel-1-delivered-at')).toHaveTextContent('Delivered');
    await userEvent.click(screen.getByTestId('order-return-open'));
    expect(screen.getByTestId('order-return-submit')).toBeDisabled();
    await userEvent.clear(screen.getByTestId('order-return-qty-4'));
    await userEvent.type(screen.getByTestId('order-return-qty-4'), '1');
    await userEvent.selectOptions(screen.getByTestId('order-return-reason'), 'WRONG_ITEM');
    await userEvent.click(screen.getByTestId('order-return-submit'));

    expect(returns.create).toHaveBeenCalledWith(55, { reason: 'WRONG_ITEM', comment: undefined, items: [{ productId: 4, quantity: 1 }] });
    expect(await screen.findByTestId('order-return-created')).toHaveTextContent('Return #5 requested');
  });

  it('keeps the form open and shows why a return was refused', async () => {
    parcels(parcel({ id: 7, status: 'DELIVERED' }));
    vi.mocked(returns.create).mockRejectedValue(Object.assign(new Error('Conflict'), {
      isAxiosError: true, response: { status: 409, data: { message: 'The 30-day return window has passed' } },
    }));
    renderWithProviders(<OrderFulfilment order={order('DELIVERED', undefined, 56)} />);

    await userEvent.click(await screen.findByTestId('order-return-open'));
    await userEvent.clear(screen.getByTestId('order-return-qty-3'));
    await userEvent.type(screen.getByTestId('order-return-qty-3'), '1');
    await userEvent.click(screen.getByTestId('order-return-submit'));

    expect(await screen.findByTestId('order-return-error')).toHaveTextContent('The 30-day return window has passed');
    expect(screen.getByTestId('order-return-form')).toBeInTheDocument();
  });
});
