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

  constructor(page: any) {
    super(page);
    this.chatTab = page.getByTestId('chat-tab');
    this.messageInput = page.getByTestId('chat-input');
    this.sendButton = page.getByTestId('chat-send-button');
    this.chatContent = page.getByTestId('chat-conversation');
    this.thinkingCheckbox = page.getByTestId('thinking-checkbox');
    this.thinkingToggle = page.getByTestId('thinking-toggle');
    this.thinkingContent = page.getByTestId('thinking-content');
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

  getChatMarkdownElement(selector: string) {
    return this.chatContent.locator(`[class*="markdownContainer"] ${selector}`);
  }

  getChatMessage(role: 'user' | 'assistant' | 'system') {
    return this.chatContent.getByTestId(`chat-message-${role}`);
  }

  getAllChatMessages(role: 'user' | 'assistant' | 'system') {
    return this.chatContent.locator(`[data-testid="chat-message-${role}"]`);
  }
} 