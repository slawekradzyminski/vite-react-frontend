import { Page, Locator } from '@playwright/test';

export class LLMPage {
  readonly page: Page;
  readonly modelInput: Locator;
  readonly temperatureInput: Locator;
  readonly temperatureSlider: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modelInput = page.getByTestId('model-input');
    this.temperatureInput = page.getByTestId('temperature-label');
    this.temperatureSlider = page.getByTestId('temperature-slider');
    this.errorMessage = page.getByText('Failed to fetch stream: Internal Server Error', { exact: true });
  }

  async goto() {
    await this.page.goto('/llm');
  }

  async setTemperature(temperature: number) {
    await this.temperatureSlider.fill(temperature.toString());
  }
} 