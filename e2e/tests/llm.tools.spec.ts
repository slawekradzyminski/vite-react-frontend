import { test, expect } from '../fixtures/auth.fixture';
import { ToolChatPage } from '../pages/toolChat.page.object';

const TOOL_PROMPT = 'What iphones do we have available? Tell me the details about them';

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
