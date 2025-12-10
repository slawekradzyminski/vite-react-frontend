import { Locator, Page, expect } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class ToolChatPage extends LLMPage {
  readonly container: Locator;
  readonly modelInput: Locator;
  readonly temperatureLabel: Locator;
  readonly temperatureSlider: Locator;
  readonly infoCard: Locator;
  readonly toolSchemaToggle: Locator;
  readonly toolDefinitionJson: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;
  readonly settingsPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.getByTestId('ollama-tool-chat-page');
    this.modelInput = this.container.getByTestId('model-input');
    this.temperatureLabel = this.container.getByTestId('temperature-label');
    this.temperatureSlider = this.container.getByTestId('temperature-slider');
    this.infoCard = this.container.getByTestId('tool-info-card');
    this.toolSchemaToggle = this.container.getByTestId('tool-schema-toggle');
    this.toolDefinitionJson = this.container.getByTestId('tool-definition-json');
    this.messageInput = this.container.getByTestId('chat-input');
    this.sendButton = this.container.getByTestId('chat-send-button');
    this.chatContent = this.container.getByTestId('chat-conversation');
    this.settingsPanel = this.container.getByTestId('tool-settings-panel');
  }

  async goto(path: string = '/llm/tools') {
    await super.goto(path);
  }

  async sendChatMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async setTemperature(value: number) {
    await this.expandSettings();
    await this.temperatureSlider.fill(value.toString());
  }

  async toggleToolSchema() {
    await this.toolSchemaToggle.click();
  }

  getToolCallNotices() {
    return this.chatContent.locator('[data-testid="tool-call-notice"]');
  }

  getToolMessages() {
    return this.chatContent.locator('[data-testid="tool-message"]');
  }

  async waitForChatComplete() {
    await this.sendButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="chat-send-button"]');
      return button && (!button.hasAttribute('disabled') || button.textContent === 'Send');
    }, { timeout: 30000 });
  }

  async expandSettings() {
    const isOpen = await this.settingsPanel.evaluate((panel) => panel.hasAttribute('open'));
    if (!isOpen) {
      await this.settingsPanel.locator('summary').click();
    }
    await expect(this.temperatureSlider).toBeVisible();
  }
}
