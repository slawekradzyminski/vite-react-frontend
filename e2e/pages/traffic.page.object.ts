import { type Page, type Locator } from '@playwright/test';

export class TrafficPage {
  readonly heading: Locator;
  readonly statusPill: Locator;
  readonly statusMessage: Locator;
  readonly clearEventsButton: Locator;
  readonly trafficEventsTable: Locator;
  readonly noEventsMessage: Locator;

  constructor(protected readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /traffic monitor/i });
    this.statusPill = page.getByTestId('traffic-connection-status');
    this.statusMessage = page.getByTestId('traffic-status-message');
    this.clearEventsButton = page.getByRole('button', { name: /clear events/i });
    this.trafficEventsTable = page.getByTestId('traffic-events-table');
    this.noEventsMessage = page.getByTestId('traffic-empty-state');
  }

  async goto() {
    await this.page.goto('/traffic');
  }

  async clearEvents() {
    await this.clearEventsButton.click();
  }

  async getEventRow(method: string, path: string) {
    return this.page.locator('tr', {
      has: this.page.locator(`td:has-text("${method}")`),
    }).filter({
      has: this.page.locator(`td:has-text("${path}")`)
    });
  }

  async waitForConnection() {
    await this.page.getByTestId('traffic-connection-status').getByText('Connected').waitFor();
  }
} 
