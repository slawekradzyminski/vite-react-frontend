import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { webhookInboxes, webhooks } from '../lib/api';
import { refetchAfterWrite } from '../lib/queryRefresh';
import { retryServerErrors } from '../lib/requestErrors';
import type { WebhookCreateRequest, WebhookDeliveryStatus, WebhookUpdateRequest } from '../types/commerce';

export const INBOX_REFRESH_MS = 5000;
export const DELIVERY_PAGE_SIZE = 10;

export const webhookKeys = {
  all: ['webhooks'] as const,
  list: () => ['webhooks', 'list'] as const,
  eventTypes: () => ['webhooks', 'event-types'] as const,
  deliveries: (id: number) => ['webhooks', 'deliveries', id] as const,
  deliveryPage: (id: number, status: WebhookDeliveryStatus | undefined, page: number) =>
    ['webhooks', 'deliveries', id, status ?? 'ALL', page] as const,
  inboxes: () => ['webhook-inboxes'] as const,
  inboxRequests: (token: string) => ['webhook-inboxes', token, 'requests'] as const,
};

export function useWebhookSubscriptions() {
  return useQuery({
    queryKey: webhookKeys.list(),
    queryFn: async () => (await webhooks.list()).data,
    retry: retryServerErrors,
  });
}

export function useWebhookEventTypes() {
  return useQuery({
    queryKey: webhookKeys.eventTypes(),
    queryFn: async () => (await webhooks.eventTypes()).data,
    staleTime: Infinity,
    retry: retryServerErrors,
  });
}

export function useWebhookDeliveries(id: number, status: WebhookDeliveryStatus | undefined, page: number) {
  return useQuery({
    queryKey: webhookKeys.deliveryPage(id, status, page),
    queryFn: async () => (await webhooks.deliveries(id, status, page, DELIVERY_PAGE_SIZE)).data,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
  });
}

export function useWebhookInboxes() {
  return useQuery({
    queryKey: webhookKeys.inboxes(),
    queryFn: async () => (await webhookInboxes.list()).data,
    retry: retryServerErrors,
  });
}

// Polls while the inbox is open so a test ping shows up without a manual refresh.
export function useInboxRequests(token: string, enabled: boolean) {
  return useQuery({
    queryKey: webhookKeys.inboxRequests(token),
    queryFn: async () => (await webhookInboxes.requests(token)).data,
    enabled,
    refetchInterval: enabled ? INBOX_REFRESH_MS : false,
    retry: retryServerErrors,
  });
}

export function useWebhookMutations() {
  const queryClient = useQueryClient();
  const refreshList = () => refetchAfterWrite(queryClient, webhookKeys.list());
  const refreshDeliveries = (id: number) => {
    queryClient.invalidateQueries({ queryKey: webhookKeys.deliveries(id) });
    // A delivery can change the failure counter shown on the subscription.
    refreshList();
  };

  return {
    create: useMutation({
      mutationFn: async (data: WebhookCreateRequest) => (await webhooks.create(data)).data,
      onSuccess: refreshList,
    }),
    update: useMutation({
      mutationFn: async ({ id, data }: { id: number; data: WebhookUpdateRequest }) => (await webhooks.update(id, data)).data,
      onSuccess: refreshList,
    }),
    remove: useMutation({
      mutationFn: async (id: number) => { await webhooks.remove(id); return id; },
      onSuccess: (id) => {
        queryClient.removeQueries({ queryKey: webhookKeys.deliveries(id) });
        refreshList();
      },
    }),
    rotateSecret: useMutation({
      mutationFn: async (id: number) => (await webhooks.rotateSecret(id)).data,
    }),
    sendTest: useMutation({
      mutationFn: async (id: number) => (await webhooks.test(id)).data,
      onSuccess: (_delivery, id) => refreshDeliveries(id),
    }),
    redeliver: useMutation({
      mutationFn: async ({ id, deliveryId }: { id: number; deliveryId: string }) => (await webhooks.redeliver(id, deliveryId)).data,
      onSuccess: (_delivery, { id }) => refreshDeliveries(id),
    }),
  };
}

export function useInboxMutations() {
  const queryClient = useQueryClient();
  const refresh = () => refetchAfterWrite(queryClient, webhookKeys.inboxes());
  return {
    create: useMutation({
      mutationFn: async () => (await webhookInboxes.create()).data,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: async (token: string) => { await webhookInboxes.remove(token); return token; },
      onSuccess: (token) => {
        queryClient.removeQueries({ queryKey: webhookKeys.inboxRequests(token) });
        refresh();
      },
    }),
  };
}
