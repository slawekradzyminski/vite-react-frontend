import { Page, Locator } from '@playwright/test';

export class LLMPage {
  readonly page: Page;
  readonly modelInput: Locator;
  readonly temperatureInput: Locator;
  readonly temperatureSlider: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modelInput = page.getByLabel('Model');
    this.temperatureInput = page.getByLabel('Temperature');
    this.temperatureSlider = page.getByRole('slider', { name: /Temperature/ });
    this.errorMessage = page.getByText('Failed to fetch stream: Internal Server Error', { exact: true });
  }

  async goto() {
    await this.page.goto('/llm');
  }

  async setTemperature(temperature: number) {
    await this.temperatureSlider.fill(temperature.toString());
  }
} 