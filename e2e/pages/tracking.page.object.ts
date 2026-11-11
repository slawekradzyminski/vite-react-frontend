import { Locator, Page } from '@playwright/test';

export class TrackingPage {
  readonly input: Locator;
  readonly submit: Locator;
  readonly inputError: Locator;
  readonly notFound: Locator;
  readonly currentStatus: Locator;
  readonly carrier: Locator;
  readonly trackingNumber: Locator;
  readonly estimatedDelivery: Locator;
  readonly events: Locator;

  constructor(readonly page: Page) {
    this.input = page.getByLabel('Tracking number');
    this.submit = page.getByTestId('public-tracking-submit');
    this.inputError = page.getByTestId('public-tracking-input-error');
    this.notFound = page.getByTestId('public-tracking-not-found');
    this.currentStatus = page.getByTestId('tracking-current-status');
    this.carrier = page.getByTestId('tracking-carrier');
    this.trackingNumber = page.getByTestId('tracking-number');
    this.estimatedDelivery = page.getByTestId('tracking-estimated-delivery');
    this.events = page.getByTestId('tracking-events').getByRole('listitem');
  }

  async goto(trackingNumber?: string) {
    await this.page.goto(trackingNumber ? `/track/${trackingNumber}` : '/track');
  }

  async track(trackingNumber: string) {
    await this.input.fill(trackingNumber);
    await this.submit.click();
  }
}
