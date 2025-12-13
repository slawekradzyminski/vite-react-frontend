import { Locator, Page } from '@playwright/test';
import { BaseLlmChatPage } from './baseLlm.page.object';

export class ChatPage extends BaseLlmChatPage {
  readonly container: Locator;
  readonly sidebarToggle: Locator;
  readonly sidebar: Locator;
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
    this.sidebarToggle = this.container.getByTestId('chat-sidebar-toggle');
    this.sidebar = this.container.getByTestId('chat-sidebar');
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

  async goto(path: string = '/llm/chat'): Promise<void> {
    await super.goto(path);
  }

  async enableThinking(): Promise<void> {
    await this.expandSettings();
    await this.thinkingCheckbox.check();
  }

  async disableThinking(): Promise<void> {
    await this.expandSettings();
    await this.thinkingCheckbox.uncheck();
  }

  async expandThinking(): Promise<void> {
    await this.thinkingToggle.locator('summary').click();
  }
}
