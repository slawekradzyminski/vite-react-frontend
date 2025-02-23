import { Page, Locator } from '@playwright/test';

export class OllamaPage {
  // Common elements
  readonly modelInput: Locator;
  readonly errorMessage: Locator;

  // Generate tab elements
  readonly generateTab: Locator;
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly generateContent: Locator;

  // Chat tab elements
  readonly chatTab: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;

  constructor(private readonly page: Page) {
    // Common elements
    this.modelInput = page.getByRole('textbox', { name: 'Model' });
    this.errorMessage = page.getByText('Failed to fetch stream: Internal Server Error', { exact: true });

    // Generate tab elements
    this.generateTab = page.getByTestId('generate-tab');
    this.promptInput = page.getByRole('textbox', { name: 'Prompt' });
    this.generateButton = page.getByRole('button', { name: /generate/i });
    this.generateContent = page.getByTestId('generate-content');

    // Chat tab elements
    this.chatTab = page.getByTestId('chat-tab');
    this.messageInput = page.getByPlaceholder('Type your message...');
    this.sendButton = page.getByRole('button', { name: 'Send' });
    this.chatContent = page.getByTestId('chat-content');
  }

  async goto() {
    await this.page.goto('/llm');
  }

  async openGenerateTab() {
    await this.generateTab.click();
  }

  async openChatTab() {
    await this.chatTab.click();
  }

  async generate(prompt: string, model?: string) {
    if (model) {
      await this.modelInput.clear();
      await this.modelInput.fill(model);
    }
    await this.promptInput.fill(prompt);
    await this.generateButton.click();
  }

  async sendChatMessage(message: string, model?: string) {
    if (model) {
      await this.modelInput.clear();
      await this.modelInput.fill(model);
    }
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  getMarkdownElement(selector: string) {
    return this.generateContent.locator(`[class*="markdownContainer"] ${selector}`);
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