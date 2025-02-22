import { type Page, type Locator } from '@playwright/test';

export class QrPage {
  readonly heading: Locator;
  readonly textInput: Locator;
  readonly generateButton: Locator;
  readonly clearButton: Locator;
  readonly qrCodeImage: Locator;
  readonly toast: Locator;

  constructor(protected readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /qr code generator/i });
    this.textInput = page.getByRole('textbox');
    this.generateButton = page.getByRole('button', { name: /generate qr code/i });
    this.clearButton = page.getByRole('button', { name: /clear/i });
    this.qrCodeImage = page.getByRole('img', { name: /generated qr code/i });
    this.toast = page.locator('[data-state="open"]');
  }

  async goto() {
    await this.page.goto('/qr');
  }

  async generateQrCode(text: string) {
    await this.textInput.fill(text);
    await this.generateButton.click();
  }

  async clear() {
    await this.clearButton.click();
  }
} 