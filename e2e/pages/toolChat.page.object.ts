import { Locator, Page } from '@playwright/test';
import { BaseLlmChatPage } from './baseLlm.page.object';

export class ToolChatPage extends BaseLlmChatPage {
  readonly container: Locator;
  readonly sidebarToggle: Locator;
  readonly sidebar: Locator;
  readonly modelInput: Locator;
  readonly temperatureLabel: Locator;
  readonly temperatureSlider: Locator;
  readonly toolDefinitionJson: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatContent: Locator;
  readonly settingsPanel: Locator;
  readonly systemPromptCard: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.getByTestId('ollama-tool-chat-page');
    this.sidebarToggle = this.container.getByTestId('tool-sidebar-toggle');
    this.sidebar = this.container.getByTestId('tool-sidebar');
    this.modelInput = this.container.getByTestId('model-input');
    this.temperatureLabel = this.container.getByTestId('temperature-label');
    this.temperatureSlider = this.container.getByTestId('temperature-slider');
    this.toolDefinitionJson = this.container.getByTestId('tool-definition-json');
    this.messageInput = this.container.getByTestId('chat-input');
    this.sendButton = this.container.getByTestId('chat-send-button');
    this.chatContent = this.container.getByTestId('chat-conversation');
    this.settingsPanel = this.container.getByTestId('tool-settings-panel');
    this.systemPromptCard = this.container.getByTestId('tool-system-prompt');
  }

  async goto(path: string = '/llm/tools'): Promise<void> {
    await super.goto(path);
  }

  getToolCallNotices(): Locator {
    return this.chatContent.locator('[data-testid="tool-call-notice"]');
  }

  getToolMessages(): Locator {
    return this.chatContent.locator('[data-testid="tool-message"]');
  }
}
