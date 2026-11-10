import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { webhooks } from '../../lib/api';
import { WebhookDeliveries } from './WebhookDeliveries';
import { axiosFailure, deliveryFixture, ok, page } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  webhooks: { deliveries: vi.fn(), redeliver: vi.fn() },
}));

describe('WebhookDeliveries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists deliveries and filters them by status from the first page', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.deliveries).mockResolvedValue(ok(page([deliveryFixture()], 3)) as never);
    renderWithQuery(<WebhookDeliveries subscriptionId={7} active />);
    expect(await screen.findByTestId('webhook-delivery-d-1')).toBeInTheDocument();

    // when
    await user.click(screen.getByTestId('webhook-deliveries-7-next'));
    await waitFor(() => expect(webhooks.deliveries).toHaveBeenLastCalledWith(7, undefined, 1, 10));
    await user.selectOptions(screen.getByLabelText('Delivery status'), 'FAILED');

    // then
    await waitFor(() => expect(webhooks.deliveries).toHaveBeenLastCalledWith(7, 'FAILED', 0, 10));
    expect(screen.getByTestId('webhook-delivery-status-d-1')).toHaveTextContent('DELIVERED');
    expect(screen.getByTestId('webhook-delivery-code-d-1')).toHaveTextContent('200');
  });

  it('pages back and forth', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.deliveries).mockResolvedValue(ok(page([deliveryFixture()], 2)) as never);
    renderWithQuery(<WebhookDeliveries subscriptionId={7} active />);
    await screen.findByTestId('webhook-delivery-d-1');
    expect(screen.getByTestId('webhook-deliveries-7-previous')).toBeDisabled();

    // when
    await user.click(screen.getByTestId('webhook-deliveries-7-next'));
    await waitFor(() => expect(screen.getByTestId('webhook-deliveries-7-page')).toHaveTextContent('Page 2 of 2'));
    expect(screen.getByTestId('webhook-deliveries-7-next')).toBeDisabled();
    await user.click(screen.getByTestId('webhook-deliveries-7-previous'));

    // then
    await waitFor(() => expect(screen.getByTestId('webhook-deliveries-7-page')).toHaveTextContent('Page 1 of 2'));
  });

  it('shows an empty state and a load error', async () => {
    // given
    vi.mocked(webhooks.deliveries).mockResolvedValueOnce(ok(page([])) as never);
    renderWithQuery(<WebhookDeliveries subscriptionId={7} active />);

    // then
    expect(await screen.findByTestId('webhook-deliveries-7-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('webhook-deliveries-7-page')).not.toBeInTheDocument();

    // given
    vi.mocked(webhooks.deliveries).mockRejectedValueOnce(axiosFailure(403, { message: 'Forbidden' }));
    renderWithQuery(<WebhookDeliveries subscriptionId={8} active />);

    // then
    expect(await screen.findByTestId('webhook-deliveries-8-error')).toHaveTextContent('Unable to load deliveries.');
  });

  it('opens the details drawer and redelivers through the API', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.deliveries).mockResolvedValue(ok(page([deliveryFixture()])) as never);
    vi.mocked(webhooks.redeliver).mockResolvedValue(ok(deliveryFixture({ id: 'd-2' })) as never);
    renderWithQuery(<WebhookDeliveries subscriptionId={7} active />);

    // when
    await user.click(await screen.findByRole('button', { name: 'Details of delivery d-1' }));
    await user.click(screen.getByRole('button', { name: 'Redeliver' }));

    // then
    expect(webhooks.redeliver).toHaveBeenCalledWith(7, 'd-1');
    expect(await screen.findByTestId('webhook-delivery-drawer-result')).toHaveTextContent('Redelivered as d-2');
    await waitFor(() => expect(vi.mocked(webhooks.deliveries).mock.calls.length).toBeGreaterThan(1));

    // when
    await user.click(screen.getByTestId('webhook-delivery-drawer-close'));

    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refreshes on demand', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.deliveries).mockResolvedValue(ok(page([])) as never);
    renderWithQuery(<WebhookDeliveries subscriptionId={7} active />);
    await screen.findByTestId('webhook-deliveries-7-empty');

    // when
    await user.click(screen.getByTestId('webhook-deliveries-7-refresh'));

    // then
    await waitFor(() => expect(webhooks.deliveries).toHaveBeenCalledTimes(2));
  });
});
