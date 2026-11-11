import type { Locator, Page } from '@playwright/test';

export class PaymentPage {
  readonly title: Locator;
  readonly amountDue: Locator;
  readonly cardNumber: Locator;
  readonly expiry: Locator;
  readonly cvc: Locator;
  readonly holder: Locator;
  readonly submit: Locator;
  readonly testCardsToggle: Locator;
  readonly success: Locator;
  readonly successOrderLink: Locator;
  readonly failedMessage: Locator;
  readonly tryAnotherCard: Locator;
  readonly processing: Locator;
  readonly threeDsDialog: Locator;
  readonly threeDsCode: Locator;
  readonly threeDsSubmit: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByTestId('payment-title');
    this.amountDue = page.getByTestId('payment-order-amount-due');
    this.cardNumber = page.getByLabel('Card number');
    this.expiry = page.getByLabel('Expiry (MM/YY)');
    this.cvc = page.getByLabel('CVC');
    this.holder = page.getByLabel('Name on card');
    this.submit = page.getByTestId('payment-submit');
    this.testCardsToggle = page.getByTestId('payment-test-cards-toggle');
    this.success = page.getByTestId('payment-success');
    this.successOrderLink = page.getByTestId('payment-success-order-link');
    this.failedMessage = page.getByTestId('payment-failed-message');
    this.tryAnotherCard = page.getByTestId('payment-try-another-card');
    this.processing = page.getByTestId('payment-processing');
    this.threeDsDialog = page.getByRole('dialog', { name: '3-D Secure verification' });
    this.threeDsCode = this.threeDsDialog.getByLabel('Verification code');
    this.threeDsSubmit = page.getByTestId('payment-3ds-submit');
  }

  async goto(orderId: number) {
    await this.page.goto(`/orders/${orderId}/pay`);
  }

  async payWith(number: string, { expiry = '12/30', cvc = '123', holder = 'Paying Customer' } = {}) {
    await this.cardNumber.fill(number);
    await this.expiry.fill(expiry);
    await this.cvc.fill(cvc);
    await this.holder.fill(holder);
    await this.submit.click();
  }

  async useTestCard(digits: string) {
    await this.testCardsToggle.click();
    await this.page.getByTestId(`payment-test-card-${digits}`).click();
    await this.submit.click();
  }
}
