import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebhookDeliveryDrawer } from './WebhookDeliveryDrawer';
import { axiosFailure, deliveryFixture } from '../../test/webhookFixtures';

describe('WebhookDeliveryDrawer', () => {
  it('stays closed without a delivery', () => {
    // given / when
    render(<WebhookDeliveryDrawer delivery={null} onClose={vi.fn()} onRedeliver={vi.fn()} canRedeliver />);

    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the request, headers, response and retry state', () => {
    // given
    const delivery = deliveryFixture({ status: 'FAILED', lastStatusCode: 500, attempts: 3, nextAttemptAt: '2026-11-10T10:09:00Z', lastError: 'HTTP 500', responseSnippet: 'boom' });

    // when
    render(<WebhookDeliveryDrawer delivery={delivery} onClose={vi.fn()} onRedeliver={vi.fn()} canRedeliver />);

    // then
    const dialog = screen.getByRole('dialog', { name: 'Delivery details' });
    expect(within(dialog).getByTestId('webhook-delivery-drawer-status')).toHaveTextContent('FAILED');
    expect(screen.getByTestId('webhook-delivery-drawer-code')).toHaveTextContent('500');
    expect(screen.getByTestId('webhook-delivery-drawer-duration')).toHaveTextContent('12 ms');
    expect(screen.getByTestId('webhook-delivery-drawer-attempts')).toHaveTextContent('3');
    expect(screen.getByTestId('webhook-delivery-drawer-next-attempt')).not.toHaveTextContent('—');
    expect(screen.getByTestId('webhook-delivery-drawer-last-error')).toHaveTextContent('HTTP 500');
    expect(screen.getByTestId('webhook-delivery-drawer-headers')).toHaveTextContent('X-Webhook-Signature');
    expect(screen.getByTestId('webhook-delivery-drawer-headers')).toHaveTextContent('X-Webhook-Idd-1');
    expect(screen.getByTestId('webhook-delivery-drawer-payload').textContent).toContain('"type": "webhook.ping"');
    expect(screen.getByTestId('webhook-delivery-drawer-response')).toHaveTextContent('boom');
  });

  it('notes a missing response body and missing optional values', () => {
    // given
    const delivery = deliveryFixture({ responseSnippet: null, durationMs: null, lastStatusCode: null, attempts: undefined });

    // when
    render(<WebhookDeliveryDrawer delivery={delivery} onClose={vi.fn()} onRedeliver={vi.fn()} canRedeliver={false} />);

    // then
    expect(screen.getByTestId('webhook-delivery-drawer-response')).toHaveTextContent('No response body recorded.');
    expect(screen.getByTestId('webhook-delivery-drawer-duration')).toHaveTextContent('—');
    expect(screen.getByTestId('webhook-delivery-drawer-code')).toHaveTextContent('—');
    expect(screen.getByTestId('webhook-delivery-drawer-attempts')).toHaveTextContent('0');
    expect(screen.getByTestId('webhook-delivery-drawer-redeliver')).toBeDisabled();
  });

  it('redelivers and reports the new delivery', async () => {
    // given
    const user = userEvent.setup();
    const onRedeliver = vi.fn().mockResolvedValue(deliveryFixture({ id: 'd-2', status: 'DELIVERED', lastStatusCode: 200 }));
    render(<WebhookDeliveryDrawer delivery={deliveryFixture()} onClose={vi.fn()} onRedeliver={onRedeliver} canRedeliver />);

    // when
    await user.click(screen.getByRole('button', { name: 'Redeliver' }));

    // then
    expect(onRedeliver).toHaveBeenCalledWith(expect.objectContaining({ id: 'd-1' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Redelivered as d-2: DELIVERED (HTTP 200).');
  });

  it('shows why a redelivery failed and clears it on close', async () => {
    // given
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onRedeliver = vi.fn().mockRejectedValue(axiosFailure(429, { message: 'Too many requests' }));
    render(<WebhookDeliveryDrawer delivery={deliveryFixture()} onClose={onClose} onRedeliver={onRedeliver} canRedeliver />);

    // when
    await user.click(screen.getByTestId('webhook-delivery-drawer-redeliver'));
    const alert = await screen.findByRole('alert');
    await user.click(screen.getByTestId('webhook-delivery-drawer-close'));

    // then
    expect(alert).toHaveTextContent('Too many requests');
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByTestId('webhook-delivery-drawer-result')).not.toBeInTheDocument();
  });
});
