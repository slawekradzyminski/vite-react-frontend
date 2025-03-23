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
    this.statusPill = page.locator('.bg-green-100, .bg-red-100').first();
    this.statusMessage = page.locator('.bg-gray-50 p').first();
    this.clearEventsButton = page.getByRole('button', { name: /clear events/i });
    this.trafficEventsTable = page.locator('table');
    this.noEventsMessage = page.getByText(/no traffic events recorded yet/i);
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
    await this.page.waitForSelector('.bg-green-100:has-text("Connected")');
  }
} 