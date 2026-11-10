import { test, expect } from '../fixtures/mocked-session.fixture';
import { MOCK_SECRET, mockWebhookBackend } from '../mocks/webhookMocks';
import { WebhooksPage } from '../pages/webhooks.page.object';

test.describe('Webhooks (mocked backend)', () => {
  test('creates a webhook to an inbox, shows the secret once, receives a test ping and redelivers it', async ({ mockedClient }) => {
    test.setTimeout(45_000);
    // given
    const { page } = mockedClient;
    const backend = await mockWebhookBackend(page);
    const webhooksPage = new WebhooksPage(page);
    await webhooksPage.goto();
    await expect(webhooksPage.heading).toBeVisible();

    // when - an inbox is created and used as the webhook URL
    await webhooksPage.createInbox.click();
    const inbox = webhooksPage.inbox('tok1');
    await expect(inbox.url).toHaveText('inbox://tok1');
    await inbox.useAsUrl.click();

    // then
    await expect(webhooksPage.urlInput).toHaveValue('inbox://tok1');
    await expect(webhooksPage.urlInput).toBeFocused();

    // when - the webhook is created
    await webhooksPage.createWebhook(['order.created', 'webhook.ping']);

    // then - the secret is shown once
    await expect(webhooksPage.createdSecretValue).toHaveText(MOCK_SECRET);
    await expect(webhooksPage.createdSecret).toContainText('shown only once');
    const subscriptionId = backend.subscriptions[0].id as number;
    const subscription = webhooksPage.subscription(subscriptionId);
    await expect(subscription.card).toContainText('inbox://tok1');
    await expect(subscription.card).not.toContainText(MOCK_SECRET);
    await webhooksPage.dismissSecret.click();
    await expect(webhooksPage.createdSecret).toHaveCount(0);

    // when - a test ping is sent
    await subscription.sendTest.click();

    // then - the delivery is reported and listed, and the inbox receives it on its next poll
    await expect(subscription.testResult).toContainText('DELIVERED');
    await expect(subscription.deliveries).toHaveCount(1);
    await expect(inbox.requests.first()).toHaveText('webhook.ping', { timeout: 10_000 });

    // when - the delivery is inspected and redelivered
    const deliveryId = backend.deliveries[0].id as string;
    await webhooksPage.deliveryDetails(deliveryId).click();
    await expect(webhooksPage.drawer.dialog).toBeVisible();
    await expect(webhooksPage.drawer.payload).toContainText('"type": "webhook.ping"');
    await webhooksPage.drawer.redeliver.click();

    // then
    await expect(webhooksPage.drawer.result).toContainText('Redelivered as');
    await expect(webhooksPage.drawer.result).toContainText('DELIVERED');
    await webhooksPage.drawer.close.click();
    await expect(webhooksPage.drawer.dialog).toBeHidden();
    await expect(subscription.deliveries).toHaveCount(2);
    await expect(inbox.requests).toHaveCount(2, { timeout: 10_000 });

    // when - the page is reloaded
    await page.reload();

    // then - the secret is not shown again
    await expect(subscription.card).toBeVisible();
    await expect(page.getByText(MOCK_SECRET)).toHaveCount(0);
  });

  test('shows an SSRF rejection under the URL field', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await mockWebhookBackend(page);
    await page.route('**/api/v1/webhooks', (route) => route.request().method() === 'POST'
      ? route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Webhook URL rejected: Host 10.0.0.1 resolves to a private address' }) })
      : route.fallback());
    const webhooksPage = new WebhooksPage(page);
    await webhooksPage.goto();

    // when
    await webhooksPage.urlInput.fill('http://10.0.0.1/hook');
    await webhooksPage.createWebhook(['order.created']);

    // then
    await expect(page.getByTestId('webhook-create-url-error')).toContainText('resolves to a private address');
    await expect(webhooksPage.urlInput).toHaveAttribute('aria-invalid', 'true');
  });
});
