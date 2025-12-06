import { Locator } from '@playwright/test';
import { LLMPage } from './llm.page.object';

export class ChatPage extends LLMPage {
  readonly chatTab: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;
  readonly thinkingCheckbox: Locator;
  readonly thinkingToggle: Locator;
  readonly thinkingContent: Locator;
  readonly toolModeCheckbox: Locator;
  readonly toolModeInfo: Locator;

  constructor(page: any) {
    super(page);
    this.chatTab = page.getByTestId('chat-tab');
    this.messageInput = page.getByTestId('chat-input');
    this.sendButton = page.getByTestId('chat-send-button');
    this.chatContent = page.getByTestId('chat-conversation');
    this.thinkingCheckbox = page.getByTestId('thinking-checkbox');
    this.thinkingToggle = page.getByTestId('thinking-toggle');
    this.thinkingContent = page.getByTestId('thinking-content');
    this.toolModeCheckbox = page.getByTestId('tool-mode-checkbox');
    this.toolModeInfo = page.getByTestId('tool-mode-info');
  }

  async openChatTab() {
    await this.chatTab.click();
  }

  async sendChatMessage(message: string, model?: string) {
    if (model) {
      await this.modelInput.clear();
      await this.modelInput.fill(model);
    }
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async enableThinking() {
    await this.thinkingCheckbox.check();
  }

  async disableThinking() {
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking() {
    await this.thinkingToggle.locator('summary').click();
  }

  async enableToolMode() {
    await this.toolModeCheckbox.check();
  }

  async disableToolMode() {
    await this.toolModeCheckbox.uncheck();
  }

  getChatMarkdownElement(selector: string) {
    return this.chatContent.locator(`[class*="markdownContainer"] ${selector}`);
  }

  getChatMessage(role: 'user' | 'assistant' | 'system') {
    return this.chatContent.getByTestId(`chat-message-${role}`);
  }

  getAllChatMessages(role: 'user' | 'assistant' | 'system') {
    return this.chatContent.locator(`[data-testid="chat-message-${role}"]`);
  }

  getToolCallNotices() {
    return this.chatContent.locator('[data-testid="tool-call-notice"]');
  }

  getToolMessages() {
    return this.chatContent.locator('[data-testid="tool-message"]');
  }

  getToolMessageContent() {
    return this.chatContent.locator('[data-testid="tool-message-content"]');
  }

  async getMessageOrder() {
    const containers = this.chatContent.locator('[data-testid^="chat-message-container-"]');
    const count = await containers.count();
    const order: string[] = [];
    for (let i = 0; i < count; i++) {
      const container = containers.nth(i);
      if (await container.locator('[data-testid="tool-message"]').count() > 0) {
        order.push('tool');
      } else if (await container.locator('[data-testid="tool-call-notice"]').count() > 0) {
        order.push('assistant-tool-call');
      } else if (await container.locator('[data-testid="chat-message-assistant"]').count() > 0) {
        order.push('assistant');
      } else if (await container.locator('[data-testid="chat-message-user"]').count() > 0) {
        order.push('user');
      } else if (await container.locator('[data-testid="chat-message-system"]').count() > 0) {
        order.push('system');
      }
    }
    return order;
  }

  async waitForChatComplete() {
    await this.sendButton.waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="chat-send-button"]');
      return button && !button.hasAttribute('disabled') || button?.textContent === 'Send';
    }, { timeout: 30000 });
  }
} 