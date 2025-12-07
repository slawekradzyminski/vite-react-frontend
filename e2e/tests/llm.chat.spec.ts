import { test, expect } from '../fixtures/auth.fixture';
import { ChatPage } from '../pages/chat.page.object';
import { ToolChatPage } from '../pages/toolChat.page.object';

const STATUS_PROMPT = 'Give me a quick status update on the Ollama mock';
const TOOL_PROMPT = 'What iphones do we have available? Tell me the details about them';

test.describe('Ollama Chat', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    chatPage = new ChatPage(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
  });

  test('responds with deterministic mock content', async () => {
    await chatPage.sendChatMessage(STATUS_PROMPT);
    await chatPage.waitForChatComplete();

    await expect(chatPage.getChatMessage('user')).toContainText(STATUS_PROMPT);
    await expect(chatPage.getChatMessage('assistant')).toContainText('The Ollama mock is up on port 11434');
  });

  test('shows thinking content when enabled', async () => {
    await chatPage.enableThinking();
    await chatPage.sendChatMessage(STATUS_PROMPT);
    await chatPage.waitForChatComplete();

    await expect(chatPage.thinkingToggle).toBeVisible();
    await chatPage.expandThinking();
    await expect(chatPage.thinkingContent).toContainText('Reviewing the latest notes about the local mock server');
  });

  test('exposes default model and allows editing the value', async () => {
    await expect(chatPage.modelInput).toHaveValue('qwen3:0.6b');

    await chatPage.modelInput.fill('custom-model');
    await expect(chatPage.modelInput).toHaveValue('custom-model');
  });

  test('updates temperature label when slider changes', async () => {
    await chatPage.setTemperature(0.3);
    await expect(chatPage.temperatureLabel).toContainText('0.30');
  });
});

test.describe('Ollama Tool Calling', () => {
  let toolChatPage: ToolChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    toolChatPage = new ToolChatPage(authenticatedPage.page);
    await toolChatPage.goto();
    await toolChatPage.openToolsTab();
  });

  test('shows tool info and available functions', async () => {
    await expect(toolChatPage.infoCard).toBeVisible();
    const toolItems = toolChatPage.toolDefinitionList.locator('[data-testid="tool-definition-item"]');
    await expect(toolItems.first()).toBeVisible();
    await expect(toolChatPage.modelInput).toHaveValue('qwen3:4b-instruct');
  });

  test('streams tool calls and final summary from the mock', async () => {
    await toolChatPage.sendChatMessage(TOOL_PROMPT);
    await toolChatPage.waitForChatComplete();

    await expect(toolChatPage.getToolCallNotices().first()).toContainText('list_products');
    await expect(toolChatPage.getToolMessages().first()).toContainText('Function output');
    await expect(toolChatPage.getToolMessages().last()).toContainText('"price": 999');
    await expect(toolChatPage.chatContent.getByTestId('chat-message-assistant').last()).toContainText('iPhone 13 Pro');
  });

  test('allows adjusting the temperature slider', async () => {
    await toolChatPage.setTemperature(0.2);
    await expect(toolChatPage.temperatureLabel).toContainText('0.20');
  });
});
