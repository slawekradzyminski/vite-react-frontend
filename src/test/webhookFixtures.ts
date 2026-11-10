import type { WebhookDelivery, WebhookEventType, WebhookInbox, WebhookInboxRequest, WebhookSubscription } from '../types/commerce';

export const eventTypesFixture: WebhookEventType[] = [
  { name: 'order.created', description: 'An order was placed' },
  { name: 'order.paid', description: 'An order was paid' },
  { name: 'webhook.ping', description: 'Test event' },
];

export const subscriptionFixture = (overrides: Partial<WebhookSubscription> = {}): WebhookSubscription => ({
  id: 7,
  username: 'alice',
  url: 'https://example.com/hook',
  description: 'Order sync',
  events: ['order.created'],
  active: true,
  consecutiveFailures: 0,
  disabledReason: null,
  createdAt: '2026-11-10T10:00:00Z',
  updatedAt: '2026-11-10T10:00:00Z',
  ...overrides,
});

export const deliveryFixture = (overrides: Partial<WebhookDelivery> = {}): WebhookDelivery => ({
  id: 'd-1',
  subscriptionId: 7,
  eventId: 'e-1',
  eventType: 'webhook.ping',
  status: 'DELIVERED',
  attempts: 1,
  nextAttemptAt: null,
  lastStatusCode: 200,
  lastError: null,
  responseSnippet: '{"ok":true}',
  durationMs: 12,
  payload: '{"id":"e-1","type":"webhook.ping","data":{}}',
  createdAt: '2026-11-10T10:05:00Z',
  deliveredAt: '2026-11-10T10:05:01Z',
  ...overrides,
});

export const inboxFixture = (overrides: Partial<WebhookInbox> = {}): WebhookInbox => ({
  token: 'tok1',
  url: 'inbox://tok1',
  createdAt: '2026-11-10T09:00:00Z',
  ...overrides,
});

export const inboxRequestFixture = (overrides: Partial<WebhookInboxRequest> = {}): WebhookInboxRequest => ({
  id: 1,
  receivedAt: '2026-11-10T10:05:01Z',
  headers: { 'X-Webhook-Event': 'webhook.ping', 'X-Webhook-Signature': 't=1794346833,v1=abcdef' },
  body: '{"id":"e-1","type":"webhook.ping"}',
  ...overrides,
});

// Axios-shaped success and failure values for mocked API calls.
export const ok = <T>(data: T) => ({ data, status: 200, statusText: 'OK', headers: {}, config: {} });

export const axiosFailure = (status: number, data: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response: { status, data } });

export const page = <T>(content: T[], totalPages = 1, pageNumber = 0) => ({
  content,
  totalPages,
  totalElements: content.length,
  pageNumber,
  pageSize: 20,
});
