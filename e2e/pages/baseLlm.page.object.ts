import { Locator, Page, expect } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export interface LlmPageLocators {
  container: Locator;
  sidebarToggle: Locator;
  sidebar: Locator;
  modelInput: Locator;
  temperatureLabel: Locator;
  temperatureSlider: Locator;
  settingsPanel: Locator;
}

export abstract class BaseLlmPage extends LLMPage {
  abstract readonly container: Locator;
  abstract readonly sidebarToggle: Locator;
  abstract readonly sidebar: Locator;
  abstract readonly modelInput: Locator;
  abstract readonly temperatureLabel: Locator;
  abstract readonly temperatureSlider: Locator;
  abstract readonly settingsPanel: Locator;

  constructor(page: Page) {
    super(page);
  }

  async expandSettings(): Promise<void> {
    const isHidden = await this.sidebar.getAttribute('aria-hidden');
    if (isHidden !== 'false') {
      await this.sidebarToggle.click();
    }
    await expect(this.sidebar).toBeVisible();
    await expect(this.temperatureSlider).toBeVisible();
  }

  async collapseSettings(): Promise<void> {
    const isHidden = await this.sidebar.getAttribute('aria-hidden');
    if (isHidden === 'false') {
      await this.sidebarToggle.click();
    }
  }

  async setModel(modelName: string): Promise<void> {
    await this.expandSettings();
    await this.modelInput.clear();
    await this.modelInput.fill(modelName);
  }

  async setTemperature(value: number): Promise<void> {
    await this.expandSettings();
    await this.temperatureSlider.fill(value.toString());
  }

  async getModel(): Promise<string> {
    await this.expandSettings();
    return await this.modelInput.inputValue();
  }

  async isSettingsOpen(): Promise<boolean> {
    const isHidden = await this.sidebar.getAttribute('aria-hidden');
    return isHidden === 'false';
  }
}

export abstract class BaseLlmChatPage extends BaseLlmPage {
  abstract readonly messageInput: Locator;
  abstract readonly sendButton: Locator;
  abstract readonly chatContent: Locator;
  abstract readonly systemPromptCard: Locator;

  async sendChatMessage(message: string, model?: string): Promise<void> {
    if (model) {
      await this.setModel(model);
    }
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async expandSystemPrompt(): Promise<void> {
    await this.systemPromptCard.locator('summary').click();
  }

  async waitForChatComplete(): Promise<void> {
    await this.sendButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="chat-send-button"]');
      return button && (!button.hasAttribute('disabled') || button.textContent === 'Send');
    }, { timeout: 30000 });
  }

  getChatMessage(role: 'user' | 'assistant' | 'system'): Locator {
    return this.chatContent.getByTestId(`chat-message-${role}`);
  }
}

export abstract class BaseLlmGeneratePage extends BaseLlmPage {
  abstract readonly promptInput: Locator;
  abstract readonly generateButton: Locator;
  abstract readonly responseContent: Locator;

  async generateResponse(prompt: string, model?: string): Promise<void> {
    if (model) {
      await this.setModel(model);
    }
    await this.promptInput.fill(prompt);
    await this.generateButton.click();
  }

  async waitForGenerationComplete(): Promise<void> {
    await this.generateButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="generate-button"]');
      return button && (!button.hasAttribute('disabled') || button.textContent === 'Generate');
    }, { timeout: 30000 });
  }
}
