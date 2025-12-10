import { Locator, Page, expect } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class ChatPage extends LLMPage {
  readonly container: Locator;
  readonly modelInput: Locator;
  readonly temperatureLabel: Locator;
  readonly temperatureSlider: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;
  readonly thinkingCheckbox: Locator;
  readonly thinkingToggle: Locator;
  readonly thinkingContent: Locator;
  readonly settingsPanel: Locator;
  readonly systemPromptCard: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.getByTestId('ollama-chat-page');
    this.modelInput = this.container.getByTestId('model-input');
    this.temperatureLabel = this.container.getByTestId('temperature-label');
    this.temperatureSlider = this.container.getByTestId('temperature-slider');
    this.messageInput = this.container.getByTestId('chat-input');
    this.sendButton = this.container.getByTestId('chat-send-button');
    this.chatContent = this.container.getByTestId('chat-conversation');
    this.thinkingCheckbox = this.container.getByTestId('thinking-checkbox');
    this.thinkingToggle = this.chatContent.getByTestId('thinking-toggle');
    this.thinkingContent = this.chatContent.getByTestId('thinking-content');
    this.settingsPanel = this.container.getByTestId('chat-settings-panel');
    this.systemPromptCard = this.container.getByTestId('chat-system-prompt');
  }

  async goto(path: string = '/llm/chat') {
    await super.goto(path);
  }

  async sendChatMessage(message: string, model?: string) {
    if (model) {
      await this.expandSettings();
      await this.modelInput.clear();
      await this.modelInput.fill(model);
    }
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async setTemperature(temperature: number) {
    await this.expandSettings();
    await this.temperatureSlider.fill(temperature.toString());
  }

  async enableThinking() {
    await this.expandSettings();
    await this.thinkingCheckbox.check();
  }

  async disableThinking() {
    await this.expandSettings();
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking() {
    await this.thinkingToggle.locator('summary').click();
  }

  getChatMessage(role: 'user' | 'assistant' | 'system') {
    return this.chatContent.getByTestId(`chat-message-${role}`);
  }

  async expandSettings() {
    const isOpen = await this.settingsPanel.evaluate((panel) => panel.hasAttribute('open'));
    if (!isOpen) {
      await this.settingsPanel.locator('summary').click();
    }
    await expect(this.temperatureSlider).toBeVisible();
  }

  async expandSystemPrompt() {
    await this.systemPromptCard.locator('summary').click();
  }

  async waitForChatComplete() {
    await this.sendButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="chat-send-button"]');
      return button && (!button.hasAttribute('disabled') || button.textContent === 'Send');
    }, { timeout: 30000 });
  }
}
