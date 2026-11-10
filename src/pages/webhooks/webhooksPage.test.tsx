import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { webhookInboxes, webhooks } from '../../lib/api';
import { WebhooksPage } from './webhooksPage';
import { axiosFailure, eventTypesFixture, inboxFixture, ok, subscriptionFixture } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  webhooks: {
    list: vi.fn(), eventTypes: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), rotateSecret: vi.fn(),
    test: vi.fn(), deliveries: vi.fn(), redeliver: vi.fn(),
  },
  webhookInboxes: { list: vi.fn(), create: vi.fn(), remove: vi.fn(), requests: vi.fn() },
}));

describe('WebhooksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webhooks.list).mockResolvedValue(ok([]) as never);
    vi.mocked(webhooks.eventTypes).mockResolvedValue(ok(eventTypesFixture) as never);
    vi.mocked(webhookInboxes.list).mockResolvedValue(ok([inboxFixture()]) as never);
    vi.mocked(webhookInboxes.requests).mockResolvedValue(ok([]) as never);
  });

  it('sets the title and shows the empty state, the form, the inbox and the signature help', async () => {
    // given / when
    renderWithQuery(<WebhooksPage />);

    // then
    expect(document.title).toContain('Webhooks');
    expect(await screen.findByTestId('webhook-subscriptions-empty')).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: /order\.created/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verify the signature' })).toBeInTheDocument();
    expect(await screen.findByTestId('webhook-inbox-tok1')).toBeInTheDocument();
  });

  it('creates a webhook and shows its secret once', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhooks.create).mockResolvedValue(ok(subscriptionFixture({ secret: 'whsec_once' })) as never);
    renderWithQuery(<WebhooksPage />);

    // when
    await user.type(screen.getByLabelText('Endpoint URL'), 'https://example.com/hook');
    await user.click(await screen.findByRole('checkbox', { name: /order\.created/ }));
    await user.click(screen.getByRole('button', { name: 'Create webhook' }));

    // then
    expect(webhooks.create).toHaveBeenCalledWith({ url: 'https://example.com/hook', events: ['order.created'], description: null });
    expect(await screen.findByTestId('webhook-created-secret-value')).toHaveTextContent('whsec_once');
    expect(screen.getByLabelText('Endpoint URL')).toHaveValue('');

    // when
    await user.click(screen.getByTestId('webhook-created-secret-dismiss'));

    // then
    expect(screen.queryByTestId('webhook-created-secret')).not.toBeInTheDocument();
  });

  it('fills the form with an inbox URL', async () => {
    // given
    const user = userEvent.setup();
    renderWithQuery(<WebhooksPage />);

    // when
    await user.click(await screen.findByTestId('webhook-inbox-use-tok1'));

    // then
    expect(screen.getByLabelText('Endpoint URL')).toHaveValue('inbox://tok1');
    await waitFor(() => expect(screen.getByLabelText('Endpoint URL')).toHaveFocus());
  });

  it('lists existing subscriptions', async () => {
    // given
    vi.mocked(webhooks.list).mockResolvedValue(ok([subscriptionFixture()]) as never);

    // when
    renderWithQuery(<WebhooksPage />);

    // then
    expect(await screen.findByTestId('webhook-7')).toBeInTheDocument();
  });

  it('reports load failures', async () => {
    // given
    vi.mocked(webhooks.list).mockRejectedValue(axiosFailure(403, {}));
    vi.mocked(webhooks.eventTypes).mockRejectedValue(axiosFailure(403, {}));

    // when
    renderWithQuery(<WebhooksPage />);

    // then
    expect(await screen.findByTestId('webhook-subscriptions-error')).toBeInTheDocument();
    expect(await screen.findByTestId('webhook-create-event-types-error')).toBeInTheDocument();
  });
});
