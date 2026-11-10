import type { Locator, Page } from '@playwright/test';

export class AdminGiftCardsPage {
  readonly amount: Locator;
  readonly recipient: Locator;
  readonly issue: Locator;
  readonly issuedCode: Locator;

  constructor(readonly page: Page) {
    this.amount = page.getByLabel('Amount (USD)');
    this.recipient = page.getByLabel('Recipient username (optional)');
    this.issue = page.getByTestId('admin-gift-card-issue');
    this.issuedCode = page.getByTestId('admin-gift-card-issued-code');
  }

  async gotoFromDashboard() {
    await this.page.goto('/admin');
    await this.page.getByTestId('admin-dashboard-gift-cards-link').click();
  }

  row(code: string) {
    return this.page.getByTestId(`admin-gift-card-row-${code}`);
  }

  async issueCard(amount: string, recipient?: string) {
    await this.amount.fill(amount);
    if (recipient) await this.recipient.fill(recipient);
    await this.issue.click();
  }
}

export class AdminVatRatesPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/admin/vat-rates');
  }

  rate(countryCode: string) {
    return this.page.getByTestId(`admin-vat-rate-${countryCode}`);
  }

  async editRate(countryCode: string, rate: string) {
    await this.page.getByTestId(`admin-vat-edit-${countryCode}`).click();
    const input = this.page.getByTestId(`admin-vat-edit-${countryCode}-rate`);
    await input.fill(rate);
    await this.page.getByTestId(`admin-vat-edit-${countryCode}-save`).click();
  }

  rateError(countryCode: string) {
    return this.page.getByTestId(`admin-vat-edit-${countryCode}-rate-error`);
  }
}
