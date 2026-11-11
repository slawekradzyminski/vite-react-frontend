import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { webhookInboxes, webhooks } from '../lib/api';
import { deliveryFixture, eventTypesFixture, inboxFixture, inboxRequestFixture, ok, page, subscriptionFixture } from '../test/webhookFixtures';
import {
  INBOX_REFRESH_MS,
  useInboxMutations,
  useInboxRequests,
  useWebhookDeliveries,
  useWebhookEventTypes,
  useWebhookInboxes,
  useWebhookMutations,
  useWebhookSubscriptions,
  webhookKeys,
} from './useWebhooks';

vi.mock('../lib/api', () => ({
  webhooks: {
    list: vi.fn(), eventTypes: vi.fn(), deliveries: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
    rotateSecret: vi.fn(), test: vi.fn(), redeliver: vi.fn(),
  },
  webhookInboxes: { list: vi.fn(), create: vi.fn(), remove: vi.fn(), requests: vi.fn() },
}));

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

describe('webhook queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('loads subscriptions and event types', async () => {
    // given
    vi.mocked(webhooks.list).mockResolvedValue(ok([subscriptionFixture()]) as never);
    vi.mocked(webhooks.eventTypes).mockResolvedValue(ok(eventTypesFixture) as never);

    // when
    const subscriptions = renderHook(() => useWebhookSubscriptions(), { wrapper });
    const eventTypes = renderHook(() => useWebhookEventTypes(), { wrapper });

    // then
    await waitFor(() => expect(subscriptions.result.current.data).toHaveLength(1));
    await waitFor(() => expect(eventTypes.result.current.data).toEqual(eventTypesFixture));
  });

  it('requests a filtered page of deliveries', async () => {
    // given
    vi.mocked(webhooks.deliveries).mockResolvedValue(ok(page([deliveryFixture()])) as never);

    // when
    const { result } = renderHook(() => useWebhookDeliveries(7, 'FAILED', 2), { wrapper });

    // then
    await waitFor(() => expect(result.current.data?.content).toHaveLength(1));
    expect(webhooks.deliveries).toHaveBeenCalledWith(7, 'FAILED', 2, 10);
  });

  it('loads inboxes and polls an open inbox every 5 seconds', async () => {
    // given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(webhookInboxes.list).mockResolvedValue(ok([inboxFixture()]) as never);
    vi.mocked(webhookInboxes.requests).mockResolvedValue(ok([inboxRequestFixture()]) as never);

    try {
      // when
      const inboxes = renderHook(() => useWebhookInboxes(), { wrapper });
      const requests = renderHook(() => useInboxRequests('tok1', true), { wrapper });
      await waitFor(() => expect(requests.result.current.data).toHaveLength(1));
      await waitFor(() => expect(inboxes.result.current.data).toHaveLength(1));
      await act(async () => { await vi.advanceTimersByTimeAsync(INBOX_REFRESH_MS + 10); });

      // then
      await waitFor(() => expect(webhookInboxes.requests).toHaveBeenCalledTimes(2));
      expect(webhookInboxes.requests).toHaveBeenCalledWith('tok1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not poll a closed inbox', () => {
    // given / when
    renderHook(() => useInboxRequests('tok1', false), { wrapper });

    // then
    expect(webhookInboxes.requests).not.toHaveBeenCalled();
  });
});

describe('webhook mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('refreshes the list after create, update and delete', async () => {
    // given
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const remove = vi.spyOn(client, 'removeQueries');
    vi.mocked(webhooks.create).mockResolvedValue(ok(subscriptionFixture({ secret: 'whsec_1' })) as never);
    vi.mocked(webhooks.update).mockResolvedValue(ok(subscriptionFixture()) as never);
    vi.mocked(webhooks.remove).mockResolvedValue(ok(undefined) as never);
    const { result } = renderHook(() => useWebhookMutations(), { wrapper });

    // when
    const created = await act(() => result.current.create.mutateAsync({ url: 'https://example.com', events: ['order.created'] }));
    await act(() => result.current.update.mutateAsync({ id: 7, data: { url: 'https://example.com', events: [] } }));
    await act(() => result.current.remove.mutateAsync(7));

    // then
    expect(created.secret).toBe('whsec_1');
    expect(webhooks.update).toHaveBeenCalledWith(7, { url: 'https://example.com', events: [] });
    expect(webhooks.remove).toHaveBeenCalledWith(7);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: webhookKeys.list() });
    expect(invalidate).toHaveBeenCalledTimes(3);
    expect(remove).toHaveBeenCalledWith({ queryKey: webhookKeys.deliveries(7) });
  });

  it('refreshes deliveries after a test, a redelivery, and returns a rotated secret', async () => {
    // given
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(webhooks.test).mockResolvedValue(ok(deliveryFixture()) as never);
    vi.mocked(webhooks.redeliver).mockResolvedValue(ok(deliveryFixture({ id: 'd-2' })) as never);
    vi.mocked(webhooks.rotateSecret).mockResolvedValue(ok(subscriptionFixture({ secret: 'whsec_new' })) as never);
    const { result } = renderHook(() => useWebhookMutations(), { wrapper });

    // when
    const tested = await act(() => result.current.sendTest.mutateAsync(7));
    const redelivered = await act(() => result.current.redeliver.mutateAsync({ id: 7, deliveryId: 'd-1' }));
    const rotated = await act(() => result.current.rotateSecret.mutateAsync(7));

    // then
    expect(tested.id).toBe('d-1');
    expect(redelivered.id).toBe('d-2');
    expect(webhooks.redeliver).toHaveBeenCalledWith(7, 'd-1');
    expect(rotated.secret).toBe('whsec_new');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: webhookKeys.deliveries(7) });
    expect(invalidate.mock.calls.filter(([filters]) => JSON.stringify(filters?.queryKey) === JSON.stringify(webhookKeys.deliveries(7)))).toHaveLength(2);
  });

  it('creates and deletes inboxes', async () => {
    // given
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const remove = vi.spyOn(client, 'removeQueries');
    vi.mocked(webhookInboxes.create).mockResolvedValue(ok(inboxFixture()) as never);
    vi.mocked(webhookInboxes.remove).mockResolvedValue(ok(undefined) as never);
    const { result } = renderHook(() => useInboxMutations(), { wrapper });

    // when
    const inbox = await act(() => result.current.create.mutateAsync());
    await act(() => result.current.remove.mutateAsync('tok1'));

    // then
    expect(inbox.url).toBe('inbox://tok1');
    expect(webhookInboxes.remove).toHaveBeenCalledWith('tok1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: webhookKeys.inboxes() });
    expect(remove).toHaveBeenCalledWith({ queryKey: webhookKeys.inboxRequests('tok1') });
  });
});
