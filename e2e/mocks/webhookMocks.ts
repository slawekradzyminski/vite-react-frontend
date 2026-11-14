import type { Page, Route } from '@playwright/test';
import { fulfillWithNotificationSchema, type NotificationSchema } from './notificationContract';

type Subscription = NotificationSchema<'WebhookSubscriptionDto'>;
type Delivery = NotificationSchema<'WebhookDeliveryDto'>;
type Inbox = NotificationSchema<'WebhookInboxDto'>;
type InboxRequest = NotificationSchema<'WebhookInboxRequestDto'>;

export const MOCK_SECRET = 'whsec_mocked_secret_shown_once';

const EVENT_TYPES: NotificationSchema<'WebhookEventTypeDto'>[] = [
  { name: 'order.created', description: 'An order was placed' },
  { name: 'order.paid', description: 'An order was paid' },
  { name: 'order.reservation-expired', description: 'The stock reservation of an unpaid order expired' },
  { name: 'webhook.ping', description: 'Test event sent from the UI' },
];

const json = (route: Route) => JSON.parse(route.request().postData() ?? '{}');

// An in-memory stand-in for the webhook endpoints of notification-service: subscriptions,
// deliveries and inboxes, with a test ping that lands in the targeted inbox.
export async function mockWebhookBackend(page: Page) {
  const subscriptions: Subscription[] = [];
  const deliveries: Delivery[] = [];
  const inboxes: Inbox[] = [];
  const received = new Map<string, InboxRequest[]>();
  let nextId = 1;

  const deliver = (subscription: Subscription, eventId: string, eventType: string, payload: string): Delivery => {
    const delivery: Delivery = {
      id: `delivery-${nextId++}`,
      subscriptionId: subscription.id,
      eventId,
      eventType,
      status: 'DELIVERED',
      attempts: 1,
      nextAttemptAt: null,
      lastStatusCode: 200,
      lastError: null,
      responseSnippet: null,
      durationMs: 3,
      payload,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    };
    deliveries.unshift(delivery);
    const token = subscription.url?.replace('inbox://', '') ?? '';
    received.get(token)?.unshift({
      id: nextId++,
      receivedAt: new Date().toISOString(),
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': delivery.id as string,
        'X-Webhook-Event': eventType,
        'X-Webhook-Signature': 't=1794346833,v1=5f2b7c0e9d',
      },
      body: payload,
    });
    return delivery;
  };

  await page.route('**/api/v1/webhooks/event-types', (route) => fulfillWithNotificationSchema(route, 'WebhookEventTypeDto', EVENT_TYPES));

  await page.route('**/api/v1/webhooks', async (route) => {
    if (route.request().method() === 'POST') {
      const body = json(route);
      const subscription: Subscription = {
        id: nextId++, username: 'mocked-client', url: body.url, description: body.description ?? null, events: body.events,
        active: true, consecutiveFailures: 0, disabledReason: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      subscriptions.push(subscription);
      return fulfillWithNotificationSchema(route, 'WebhookSubscriptionDto', { ...subscription, secret: MOCK_SECRET }, 201);
    }
    return fulfillWithNotificationSchema(route, 'WebhookSubscriptionDto', subscriptions);
  });

  await page.route(/\/api\/v1\/webhooks\/\d+\/test$/, (route) => {
    const id = Number(route.request().url().match(/webhooks\/(\d+)\/test/)?.[1]);
    const subscription = subscriptions.find((candidate) => candidate.id === id) as Subscription;
    const eventId = `event-${nextId++}`;
    const payload = JSON.stringify({ id: eventId, type: 'webhook.ping', createdAt: new Date().toISOString(), data: { subscriptionId: id } });
    return fulfillWithNotificationSchema(route, 'WebhookDeliveryDto', deliver(subscription, eventId, 'webhook.ping', payload), 201);
  });

  await page.route(/\/api\/v1\/webhooks\/\d+\/deliveries(\?.*)?$/, (route) => {
    const id = Number(route.request().url().match(/webhooks\/(\d+)\/deliveries/)?.[1]);
    const content = deliveries.filter((delivery) => delivery.subscriptionId === id);
    return fulfillWithNotificationSchema(route, 'PageDtoWebhookDeliveryDto', { content, pageNumber: 0, pageSize: 10, totalElements: content.length, totalPages: 1 });
  });

  await page.route(/\/api\/v1\/webhooks\/\d+\/deliveries\/[^/]+\/redeliver$/, (route) => {
    const [, id, deliveryId] = route.request().url().match(/webhooks\/(\d+)\/deliveries\/([^/]+)\/redeliver/) ?? [];
    const original = deliveries.find((delivery) => delivery.id === deliveryId) as Delivery;
    const subscription = subscriptions.find((candidate) => candidate.id === Number(id)) as Subscription;
    return fulfillWithNotificationSchema(route, 'WebhookDeliveryDto', deliver(subscription, original.eventId as string, original.eventType as string, original.payload as string), 201);
  });

  await page.route('**/api/v1/webhook-inboxes', (route) => {
    if (route.request().method() === 'POST') {
      const token = `tok${nextId++}`;
      const inbox: Inbox = { token, url: `inbox://${token}`, createdAt: new Date().toISOString() };
      inboxes.push(inbox);
      received.set(token, []);
      return fulfillWithNotificationSchema(route, 'WebhookInboxDto', inbox, 201);
    }
    return fulfillWithNotificationSchema(route, 'WebhookInboxDto', inboxes);
  });

  await page.route(/\/api\/v1\/webhook-inboxes\/[^/]+\/requests$/, (route) => {
    const token = route.request().url().match(/webhook-inboxes\/([^/]+)\/requests/)?.[1] ?? '';
    return fulfillWithNotificationSchema(route, 'WebhookInboxRequestDto', received.get(token) ?? []);
  });

  return { subscriptions, deliveries, received };
}
