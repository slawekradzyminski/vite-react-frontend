import { Locator, Page } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class ToolChatPage extends LLMPage {
  readonly toolsTab: Locator;
  readonly container: Locator;
  readonly modelInput: Locator;
  readonly temperatureLabel: Locator;
  readonly temperatureSlider: Locator;
  readonly infoCard: Locator;
  readonly toolDefinitionList: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;

  constructor(page: Page) {
    super(page);
    this.toolsTab = page.getByTestId('tools-tab');
    this.container = page.getByTestId('tools-content');
    this.modelInput = this.container.getByTestId('model-input');
    this.temperatureLabel = this.container.getByTestId('temperature-label');
    this.temperatureSlider = this.container.getByTestId('temperature-slider');
    this.infoCard = this.container.getByTestId('tool-info-card');
    this.toolDefinitionList = this.container.getByTestId('tool-definition-list');
    this.messageInput = this.container.getByTestId('chat-input');
    this.sendButton = this.container.getByTestId('chat-send-button');
    this.chatContent = this.container.getByTestId('chat-conversation');
  }

  async openToolsTab() {
    await this.toolsTab.click();
  }

  async sendChatMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async setTemperature(value: number) {
    await this.temperatureSlider.fill(value.toString());
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
}
