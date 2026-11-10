import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { webhooks } from '../../lib/api';
import { WebhookSubscriptionCard } from './WebhookSubscriptionCard';
import { axiosFailure, deliveryFixture, eventTypesFixture, ok, page, subscriptionFixture } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  webhooks: {
    update: vi.fn(), remove: vi.fn(), rotateSecret: vi.fn(), test: vi.fn(), redeliver: vi.fn(), deliveries: vi.fn(), list: vi.fn(),
  },
}));

const renderCard = (overrides = {}) =>
  renderWithQuery(<WebhookSubscriptionCard subscription={subscriptionFixture(overrides)} eventTypes={eventTypesFixture} />);

describe('WebhookSubscriptionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webhooks.deliveries).mockResolvedValue(ok(page([deliveryFixture()])) as never);
    vi.mocked(webhooks.list).mockResolvedValue(ok([]) as never);
  });

  it('shows the URL, events, state and failure counter', () => {
    // given / when
    renderCard({ consecutiveFailures: 2 });

    // then
    expect(screen.getByRole('article', { name: 'https://example.com/hook' })).toBeInTheDocument();
    expect(screen.getByTestId('webhook-7-description')).toHaveTextContent('Order sync');
    expect(screen.getByTestId('webhook-7-events')).toHaveTextContent('order.created');
    expect(screen.getByTestId('webhook-7-active')).toHaveTextContent('Active');
    expect(screen.getByTestId('webhook-7-failures')).toHaveTextContent('2 consecutive failures');
    expect(screen.queryByTestId('webhook-7-disabled-reason')).not.toBeInTheDocument();
  });

  it('shows why a subscription was disabled and blocks test sends', () => {
    // given / when
    renderCard({ active: false, consecutiveFailures: 20, disabledReason: '20 consecutive failed deliveries' });

    // then
    expect(screen.getByTestId('webhook-7-active')).toHaveTextContent('Disabled');
    expect(screen.getByTestId('webhook-7-disabled-reason')).toHaveTextContent('20 consecutive failed deliveries');
    expect(screen.getByTestId('webhook-7-test')).toBeDisabled();
  });

  it('sends a test and shows the resulting delivery and the delivery log', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.test).mockResolvedValue(ok(deliveryFixture({ id: 'd-9', durationMs: 4, lastError: null })) as never);
    renderCard();

    // when
    await user.click(screen.getByRole('button', { name: 'Send test' }));

    // then
    const result = await screen.findByTestId('webhook-7-test-result');
    expect(result).toHaveTextContent('Test ping d-9');
    expect(result).toHaveTextContent('DELIVERED');
    expect(result).toHaveTextContent('HTTP 200 in 4 ms');
    expect(await screen.findByTestId('webhook-delivery-d-1')).toBeInTheDocument();
    expect(screen.getByTestId('webhook-7-toggle-deliveries')).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports a failed test send', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.test).mockRejectedValue(axiosFailure(409, { message: 'Subscription is disabled' }));
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-test'));

    // then
    expect(await screen.findByTestId('webhook-7-error')).toHaveTextContent('Subscription is disabled');
  });

  it('toggles the delivery log', async () => {
    // given
    const user = userEvent.setup();
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-toggle-deliveries'));

    // then
    expect(await screen.findByTestId('webhook-deliveries-7')).toBeInTheDocument();

    // when
    await user.click(screen.getByRole('button', { name: 'Hide deliveries' }));

    // then
    expect(screen.queryByTestId('webhook-deliveries-7')).not.toBeInTheDocument();
  });

  it('edits the subscription in a dialog', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.update).mockResolvedValue(ok(subscriptionFixture()) as never);
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-edit'));
    const dialog = screen.getByRole('dialog', { name: 'Edit webhook' });
    const url = within(dialog).getByLabelText('Endpoint URL');
    await user.clear(url);
    await user.type(url, 'https://example.org/new');
    await user.clear(within(dialog).getByLabelText('Description (optional)'));
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    // then
    await waitFor(() => expect(webhooks.update).toHaveBeenCalledWith(7, { url: 'https://example.org/new', events: ['order.created'], description: null, active: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the edit dialog on cancel', async () => {
    // given
    const user = userEvent.setup();
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-edit'));
    await user.click(screen.getByTestId('webhook-7-edit-cancel'));

    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(webhooks.update).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.remove).mockResolvedValue(ok(undefined) as never);
    renderCard();

    // when - cancelled
    await user.click(screen.getByTestId('webhook-7-delete'));
    expect(screen.getByRole('dialog', { name: 'Delete webhook?' })).toHaveTextContent('cannot be undone');
    await user.click(screen.getByTestId('webhook-7-confirm-cancel'));

    // then
    expect(webhooks.remove).not.toHaveBeenCalled();

    // when - confirmed
    await user.click(screen.getByTestId('webhook-7-delete'));
    await user.click(screen.getByRole('button', { name: 'Delete webhook' }));

    // then
    await waitFor(() => expect(webhooks.remove).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('reports a failed delete', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.remove).mockRejectedValue(axiosFailure(403, { message: 'Not your webhook' }));
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-delete'));
    await user.click(screen.getByTestId('webhook-7-confirm-confirm'));

    // then
    expect(await screen.findByTestId('webhook-7-error')).toHaveTextContent('Not your webhook');
  });

  it('rotates the secret after confirmation and shows the new secret once', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.rotateSecret).mockResolvedValue(ok(subscriptionFixture({ secret: 'whsec_rotated' })) as never);
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-rotate'));
    const confirm = screen.getByRole('dialog', { name: 'Rotate signing secret?' });
    await user.click(within(confirm).getByTestId('webhook-7-confirm-confirm'));

    // then
    expect(await screen.findByTestId('webhook-7-secret-value')).toHaveTextContent('whsec_rotated');

    // when
    await user.click(screen.getByTestId('webhook-7-secret-dismiss'));

    // then
    expect(screen.queryByTestId('webhook-7-secret')).not.toBeInTheDocument();
  });

  it('reports a failed rotation', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.rotateSecret).mockRejectedValue(axiosFailure(404, {}));
    renderCard();

    // when
    await user.click(screen.getByTestId('webhook-7-rotate'));
    await user.click(screen.getByTestId('webhook-7-confirm-confirm'));

    // then
    expect(await screen.findByTestId('webhook-7-error')).toHaveTextContent('Unable to rotate the secret.');
  });
});
