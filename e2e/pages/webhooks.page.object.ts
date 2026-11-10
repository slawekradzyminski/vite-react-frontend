import type { Locator, Page } from '@playwright/test';

export class WebhooksPage {
  readonly heading: Locator;
  readonly urlInput: Locator;
  readonly createButton: Locator;
  readonly createdSecret: Locator;
  readonly createdSecretValue: Locator;
  readonly dismissSecret: Locator;
  readonly createInbox: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Webhooks', level: 1 });
    this.urlInput = page.getByTestId('webhook-create-url');
    this.createButton = page.getByTestId('webhook-create-submit');
    this.createdSecret = page.getByTestId('webhook-created-secret');
    this.createdSecretValue = page.getByTestId('webhook-created-secret-value');
    this.dismissSecret = page.getByTestId('webhook-created-secret-dismiss');
    this.createInbox = page.getByTestId('webhook-inbox-create');
  }

  async goto() {
    await this.page.goto('/account/webhooks');
  }

  inbox(token: string) {
    return {
      useAsUrl: this.page.getByTestId(`webhook-inbox-use-${token}`),
      url: this.page.getByTestId(`webhook-inbox-url-${token}`),
      toggle: this.page.getByTestId(`webhook-inbox-toggle-${token}`),
      requests: this.page.locator(`[data-testid^="webhook-inbox-request-event-"]`),
    };
  }

  async createWebhook(events: string[]) {
    for (const event of events) {
      await this.page.getByTestId(`webhook-create-event-${event}`).check();
    }
    await this.createButton.click();
  }

  subscription(id: number) {
    return {
      card: this.page.getByTestId(`webhook-${id}`),
      sendTest: this.page.getByTestId(`webhook-${id}-test`),
      testResult: this.page.getByTestId(`webhook-${id}-test-result`),
      deliveries: this.page.getByTestId(`webhook-deliveries-${id}`).locator('tbody tr'),
    };
  }

  deliveryDetails(deliveryId: string) {
    return this.page.getByTestId(`webhook-delivery-details-${deliveryId}`);
  }

  get drawer() {
    return {
      dialog: this.page.getByRole('dialog', { name: 'Delivery details' }),
      payload: this.page.getByTestId('webhook-delivery-drawer-payload'),
      redeliver: this.page.getByTestId('webhook-delivery-drawer-redeliver'),
      result: this.page.getByTestId('webhook-delivery-drawer-result'),
      close: this.page.getByTestId('webhook-delivery-drawer-close'),
    };
  }
}
