import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { webhookInboxes } from '../../lib/api';
import { WebhookInboxes } from './WebhookInboxes';
import { WebhookInboxRequests } from './WebhookInboxRequests';
import { axiosFailure, inboxFixture, inboxRequestFixture, ok } from '../../test/webhookFixtures';
import { renderWithQuery } from '../../test/queryWrapper';

vi.mock('../../lib/api', () => ({
  webhookInboxes: { list: vi.fn(), create: vi.fn(), remove: vi.fn(), requests: vi.fn() },
}));

describe('WebhookInboxes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webhookInboxes.requests).mockResolvedValue(ok([]) as never);
  });

  it('shows an empty state and creates an inbox that opens its request list', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhookInboxes.list).mockResolvedValueOnce(ok([]) as never).mockResolvedValue(ok([inboxFixture()]) as never);
    vi.mocked(webhookInboxes.create).mockResolvedValue(ok(inboxFixture()) as never);
    renderWithQuery(<WebhookInboxes onUseUrl={vi.fn()} />);
    expect(await screen.findByTestId('webhook-inboxes-empty')).toBeInTheDocument();

    // when
    await user.click(screen.getByRole('button', { name: 'Create inbox' }));

    // then
    expect(await screen.findByTestId('webhook-inbox-url-tok1')).toHaveTextContent('inbox://tok1');
    expect(screen.getByTestId('webhook-inbox-toggle-tok1')).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByTestId('webhook-inbox-requests-tok1-empty')).toBeInTheDocument();
    expect(screen.getByTestId('webhook-inbox-count')).toHaveTextContent('1 of 3 inboxes used');
  });

  it('disables creation at the limit of 3 inboxes', async () => {
    // given / when
    vi.mocked(webhookInboxes.list).mockResolvedValue(ok([inboxFixture(), inboxFixture({ token: 't2', url: 'inbox://t2' }), inboxFixture({ token: 't3', url: 'inbox://t3' })]) as never);
    renderWithQuery(<WebhookInboxes onUseUrl={vi.fn()} />);

    // then
    await waitFor(() => expect(screen.getByTestId('webhook-inbox-create')).toBeDisabled());
    expect(screen.getByTestId('webhook-inbox-count')).toHaveTextContent('3 of 3 inboxes used');
  });

  it('reports a failed creation and a failed load', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhookInboxes.list).mockRejectedValue(axiosFailure(403, {}));
    vi.mocked(webhookInboxes.create).mockRejectedValue(axiosFailure(409, { message: 'At most 3 inboxes per user' }));
    renderWithQuery(<WebhookInboxes onUseUrl={vi.fn()} />);

    // when
    await user.click(screen.getByTestId('webhook-inbox-create'));

    // then
    expect(await screen.findByTestId('webhook-inbox-error')).toHaveTextContent('At most 3 inboxes per user');
    expect(await screen.findByTestId('webhook-inboxes-error')).toBeInTheDocument();
  });

  it('offers the inbox URL as the webhook URL and toggles its requests', async () => {
    // given
    const user = userEvent.setup();
    const onUseUrl = vi.fn();
    vi.mocked(webhookInboxes.list).mockResolvedValue(ok([inboxFixture()]) as never);
    renderWithQuery(<WebhookInboxes onUseUrl={onUseUrl} />);

    // when
    await user.click(await screen.findByRole('button', { name: 'Use as webhook URL' }));
    await user.click(screen.getByRole('button', { name: 'View requests' }));

    // then
    expect(onUseUrl).toHaveBeenCalledWith('inbox://tok1');
    expect(await screen.findByTestId('webhook-inbox-requests-tok1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy URL: Inbox URL' })).toBeInTheDocument();

    // when
    await user.click(screen.getByRole('button', { name: 'Hide requests' }));

    // then
    expect(screen.queryByTestId('webhook-inbox-requests-tok1')).not.toBeInTheDocument();
  });

  it('deletes an inbox after confirmation', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhookInboxes.list).mockResolvedValue(ok([inboxFixture()]) as never);
    vi.mocked(webhookInboxes.remove).mockResolvedValue(ok(undefined) as never);
    renderWithQuery(<WebhookInboxes onUseUrl={vi.fn()} />);

    // when
    await user.click(await screen.findByTestId('webhook-inbox-delete-tok1'));
    await user.click(screen.getByRole('button', { name: 'Delete inbox' }));

    // then
    await waitFor(() => expect(webhookInboxes.remove).toHaveBeenCalledWith('tok1'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('reports a failed deletion and allows cancelling', async () => {
    // given
    const user = userEvent.setup();
    vi.mocked(webhookInboxes.list).mockResolvedValue(ok([inboxFixture()]) as never);
    vi.mocked(webhookInboxes.remove).mockRejectedValue(axiosFailure(404, {}));
    renderWithQuery(<WebhookInboxes onUseUrl={vi.fn()} />);

    // when
    await user.click(await screen.findByTestId('webhook-inbox-delete-tok1'));
    await user.click(screen.getByTestId('webhook-inbox-confirm-cancel'));
    await user.click(screen.getByTestId('webhook-inbox-delete-tok1'));
    await user.click(screen.getByTestId('webhook-inbox-confirm-confirm'));

    // then
    expect(await screen.findByTestId('webhook-inbox-error')).toHaveTextContent('Unable to delete the inbox.');
    expect(webhookInboxes.remove).toHaveBeenCalledTimes(1);
  });
});

describe('WebhookInboxRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows each received request with its event, signature, pretty body and headers', async () => {
    // given
    vi.mocked(webhookInboxes.requests).mockResolvedValue(ok([inboxRequestFixture()]) as never);

    // when
    renderWithQuery(<WebhookInboxRequests token="tok1" />);

    // then
    expect(await screen.findByTestId('webhook-inbox-request-event-1')).toHaveTextContent('webhook.ping');
    expect(screen.getByTestId('webhook-inbox-request-signature-1')).toHaveTextContent('t=1794346833 v1=abcdef');
    expect(screen.getByTestId('webhook-inbox-request-body-1').textContent).toBe('{\n  "id": "e-1",\n  "type": "webhook.ping"\n}');
    expect(screen.getByTestId('webhook-inbox-request-headers-1')).toHaveTextContent('X-Webhook-Signature');
    expect(webhookInboxes.requests).toHaveBeenCalledWith('tok1');
  });

  it('handles requests without headers and load failures', async () => {
    // given
    vi.mocked(webhookInboxes.requests).mockResolvedValueOnce(ok([inboxRequestFixture({ id: 2, headers: undefined, body: 'plain' })]) as never);
    renderWithQuery(<WebhookInboxRequests token="tok1" />);

    // then
    expect(await screen.findByTestId('webhook-inbox-request-event-2')).toHaveTextContent('unknown event');
    expect(screen.queryByTestId('webhook-inbox-request-signature-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('webhook-inbox-request-body-2')).toHaveTextContent('plain');

    // given
    vi.mocked(webhookInboxes.requests).mockRejectedValueOnce(axiosFailure(404, {}));
    renderWithQuery(<WebhookInboxRequests token="gone" />);

    // then
    expect(await screen.findByTestId('webhook-inbox-requests-gone-error')).toBeInTheDocument();
  });
});
