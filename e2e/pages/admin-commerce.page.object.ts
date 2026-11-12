import type { Locator, Page } from '@playwright/test';

export class AdminGiftCardsPage {
  readonly amount: Locator;
  readonly recipient: Locator;
  readonly expires: Locator;
  readonly issue: Locator;
  readonly issuedCode: Locator;

  constructor(readonly page: Page) {
    this.amount = page.getByLabel('Amount (USD)');
    this.recipient = page.getByLabel('Recipient username (optional)');
    this.expires = page.getByLabel('Expires (optional)');
    this.issue = page.getByTestId('admin-gift-card-issue');
    this.issuedCode = page.getByTestId('admin-gift-card-issued-code');
  }

  async gotoFromDashboard() {
    await this.page.goto('/admin');
    await this.page.getByTestId('admin-dashboard-gift-cards-link').click();
  }

  async goto() {
    await this.page.goto('/admin/gift-cards');
  }

  row(code: string) {
    return this.page.getByTestId(`admin-gift-card-row-${code}`);
  }

  expiry(code: string) {
    return this.page.getByTestId(`admin-gift-card-expires-${code}`);
  }

  async issueCard(amount: string, recipient?: string, expires?: string) {
    await this.amount.fill(amount);
    if (recipient) await this.recipient.fill(recipient);
    if (expires) await this.expires.fill(expires);
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

  async addCountry(countryCode: string, countryName: string, rate: string) {
    await this.page.getByTestId('admin-vat-new-country-code').fill(countryCode);
    await this.page.getByTestId('admin-vat-new-country-name').fill(countryName);
    await this.page.getByTestId('admin-vat-new-rate').fill(rate);
    await this.page.getByTestId('admin-vat-new-save').click();
  }
}

export class AdminCurrenciesPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/admin/currencies');
  }

  rate(code: string) {
    return this.page.getByTestId(`admin-currency-rate-${code}`);
  }

  async addCurrency(code: string, name: string, symbol: string, rateToUsd: string) {
    await this.page.getByTestId('admin-currency-new-code').fill(code);
    await this.page.getByTestId('admin-currency-new-name').fill(name);
    await this.page.getByTestId('admin-currency-new-symbol').fill(symbol);
    await this.page.getByTestId('admin-currency-new-rate').fill(rateToUsd);
    await this.page.getByTestId('admin-currency-new-save').click();
  }
}
