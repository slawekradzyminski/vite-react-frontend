import { Page, Locator } from '@playwright/test';

export class LLMPage {
  readonly modelInput: Locator;
  readonly errorMessage: Locator;
  readonly temperatureSlider: Locator;

  constructor(protected readonly page: Page) {
    this.modelInput = page.getByRole('textbox', { name: 'Model' });
    this.errorMessage = page.getByText('Failed to fetch stream: Internal Server Error', { exact: true });
    this.temperatureSlider = page.getByRole('slider', { name: /Temperature/ });
  }

  async goto() {
    await this.page.goto('/llm');
  }

  async setTemperature(value: number) {
    await this.temperatureSlider.fill(value.toString());
  }
} 