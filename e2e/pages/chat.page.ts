import { Locator } from '@playwright/test';
import { LLMPage } from './llm.page';

export class ChatPage extends LLMPage {
  readonly chatTab: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;

  constructor(page: any) {
    super(page);
    this.chatTab = page.getByTestId('chat-tab');
    this.messageInput = page.getByPlaceholder('Type your message...');
    this.sendButton = page.getByRole('button', { name: 'Send' });
    this.chatContent = page.getByTestId('chat-content');
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

  getChatMarkdownElement(selector: string) {
    return this.chatContent.locator(`[class*="markdownContainer"] ${selector}`);
  }

  getChatMessage(role: 'user' | 'assistant' | 'system') {
    const roleText = role.charAt(0).toUpperCase() + role.slice(1);
    return this.chatContent.locator('.text-sm.text-gray-500', { hasText: roleText }).locator('..');
  }

  getAllChatMessages(role: 'user' | 'assistant' | 'system') {
    const roleText = role.charAt(0).toUpperCase() + role.slice(1);
    return this.chatContent.locator('.text-sm.text-gray-500', { hasText: roleText }).locator('..');
  }
} 