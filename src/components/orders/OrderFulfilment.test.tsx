import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderFulfilment } from './OrderFulfilment';
import { returns, tracking, warehouse } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import type { Order } from '../../types/order';

vi.mock('../../lib/api', () => ({
  warehouse: { trackOrder: vi.fn() },
  returns: { create: vi.fn() },
  tracking: { forOrder: vi.fn() },
}));

const order = (status: Order['status'], fulfilmentState?: Order['fulfilmentState']): Order => ({
  id: 42, username: 'client', status, fulfilmentState, totalAmount: 140, createdAt: '', updatedAt: '',
  shippingAddress: { street: 'Main 1', city: 'Warsaw', state: 'MZ', zipCode: '00-001', country: 'PL' },
  items: [
    { id: 1, productId: 3, productName: 'Phone', quantity: 1, unitPrice: 100, totalPrice: 100 },
    { id: 2, productId: 4, productName: 'Cable', quantity: 2, unitPrice: 20, totalPrice: 40 },
  ],
});

describe('OrderFulfilment', () => {
  beforeEach(() => vi.resetAllMocks());

  it('falls back to the tracking 404 when the backend does not report a fulfilment state', async () => {
    vi.mocked(warehouse.trackOrder).mockRejectedValue(Object.assign(new Error('Not found'), { isAxiosError: true, response: { status: 404 } }));
    renderWithProviders(<OrderFulfilment order={order('PAID')} />);

    expect(await screen.findByTestId('order-shipment-none')).toBeInTheDocument();
    expect(warehouse.trackOrder).toHaveBeenCalledWith(42);
    expect(screen.queryByTestId('order-return-open')).not.toBeInTheDocument();
  });

  it('skips the tracking request when the order says it has not reached the warehouse', async () => {
    renderWithProviders(<OrderFulfilment order={order('PAID', 'NONE')} />);

    expect(screen.getByTestId('order-shipment-none')).toBeInTheDocument();
    expect(screen.queryByTestId('order-shipment-loading')).not.toBeInTheDocument();
    expect(warehouse.trackOrder).not.toHaveBeenCalled();
  });

  it('tracks the shipment once the order has been released to the warehouse', async () => {
    vi.mocked(warehouse.trackOrder).mockResolvedValue({ data: { id: 7, status: 'PICKED' } } as never);
    renderWithProviders(<OrderFulfilment order={order('PAID', 'PICKED')} />);

    expect(await screen.findByTestId('order-shipment-status')).toHaveTextContent(/picked/i);
    expect(warehouse.trackOrder).toHaveBeenCalledWith(42);
    expect(screen.queryByTestId('order-shipment-none')).not.toBeInTheDocument();
  });

  it('shows tracking and requests a return with only the selected quantities', async () => {
    vi.mocked(warehouse.trackOrder).mockResolvedValue({ data: { id: 7, status: 'DELIVERED', carrier: 'DHL', trackingNumber: '1234567890', deliveredAt: '2026-11-08T10:00:00' } } as never);
    vi.mocked(returns.create).mockResolvedValue({ data: { id: 5 } } as never);
    renderWithProviders(<OrderFulfilment order={order('DELIVERED')} />);

    expect(await screen.findByTestId('order-shipment-tracking')).toHaveTextContent('DHL · 1234567890');
    await userEvent.click(screen.getByTestId('order-return-open'));
    expect(screen.getByTestId('order-return-submit')).toBeDisabled();
    await userEvent.clear(screen.getByTestId('order-return-qty-4'));
    await userEvent.type(screen.getByTestId('order-return-qty-4'), '1');
    await userEvent.selectOptions(screen.getByTestId('order-return-reason'), 'WRONG_ITEM');
    await userEvent.click(screen.getByTestId('order-return-submit'));

    expect(returns.create).toHaveBeenCalledWith(42, { reason: 'WRONG_ITEM', comment: undefined, items: [{ productId: 4, quantity: 1 }] });
    expect(await screen.findByTestId('order-return-created')).toHaveTextContent('Return #5 requested');
  });

  it('keeps the form open and shows why a return was refused', async () => {
    vi.mocked(warehouse.trackOrder).mockResolvedValue({ data: { id: 7, status: 'DELIVERED' } } as never);
    vi.mocked(returns.create).mockRejectedValue(Object.assign(new Error('Conflict'), {
      isAxiosError: true, response: { status: 409, data: { message: 'The 30-day return window has passed' } },
    }));
    renderWithProviders(<OrderFulfilment order={order('DELIVERED')} />);

    await userEvent.click(await screen.findByTestId('order-return-open'));
    await userEvent.clear(screen.getByTestId('order-return-qty-3'));
    await userEvent.type(screen.getByTestId('order-return-qty-3'), '1');
    await userEvent.click(screen.getByTestId('order-return-submit'));

    expect(await screen.findByTestId('order-return-error')).toHaveTextContent('The 30-day return window has passed');
    expect(screen.getByTestId('order-return-form')).toBeInTheDocument();
  });

  it('shows the carrier timeline once the parcel has shipped', async () => {
    // given
    vi.mocked(warehouse.trackOrder).mockResolvedValue({ data: { id: 7, status: 'SHIPPED', carrier: 'DHL', trackingNumber: '1234567890' } } as never);
    vi.mocked(tracking.forOrder).mockResolvedValue({ data: {
      orderId: 42, carrier: 'DHL', trackingNumber: '1234567890', currentStatus: 'DELIVERY_FAILED',
      events: [{ status: 'DELIVERY_FAILED', location: 'Berlin', description: 'Nobody home', occurredAt: '2026-11-11T09:00:00' }],
    } } as never);

    // when
    renderWithProviders(<OrderFulfilment order={order('SHIPPED', 'SHIPPED')} />);

    // then
    expect(await screen.findByTestId('tracking-current-status')).toHaveTextContent('Delivery attempt failed');
    expect(tracking.forOrder).toHaveBeenCalledWith(42);
  });

  it('does not ask the carrier before the parcel ships', async () => {
    vi.mocked(warehouse.trackOrder).mockResolvedValue({ data: { id: 7, status: 'PACKED' } } as never);
    // A fresh order id: renderWithProviders shares one query cache between tests.
    renderWithProviders(<OrderFulfilment order={{ ...order('PAID', 'PACKED'), id: 43 }} />);

    expect(await screen.findByTestId('order-shipment-status')).toHaveTextContent(/packed/i);
    expect(tracking.forOrder).not.toHaveBeenCalled();
  });
});
