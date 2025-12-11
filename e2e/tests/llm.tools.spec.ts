import { test, expect } from '../fixtures/auth.fixture';
import { ToolChatPage } from '../pages/toolChat.page.object';

const TOOL_PROMPT = 'What iphones do we have available? Tell me the details about them';
const NARRATION_PROMPT =
  'Walk me through a two-step catalog lookup where you narrate between tool calls';

test.describe('Ollama Tool Calling', () => {
  let toolChatPage: ToolChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    toolChatPage = new ToolChatPage(authenticatedPage.page);
    await toolChatPage.goto();
  });

  test('shows tool info and available functions', async () => {
    await expect(toolChatPage.infoCard).toBeVisible();
    await expect(toolChatPage.toolSchemaToggle).toBeVisible();
    await toolChatPage.toggleToolSchema();
    await expect(toolChatPage.toolDefinitionJson).toContainText('get_product_snapshot');
    await toolChatPage.expandSettings();
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
    await toolChatPage.expandSettings();
    await toolChatPage.setTemperature(0.2);
    await expect(toolChatPage.temperatureLabel).toContainText('0.20');
  });

  test('places narration before the second tool call notice', async () => {
    await toolChatPage.sendChatMessage(NARRATION_PROMPT);
    await toolChatPage.waitForChatComplete();

    await expect(toolChatPage.getToolCallNotices()).toHaveCount(2);

    const narrationBlock = toolChatPage.chatContent
      .getByTestId('chat-message-content-assistant')
      .filter({ hasText: 'Got the catalog slice first.' })
      .first();
    await expect(narrationBlock).toBeVisible();

    const secondToolCall = toolChatPage.getToolCallNotices().nth(1);
    await expect(secondToolCall).toBeVisible();

    const narrationHandle = await narrationBlock.elementHandle();
    const toolCallHandle = await secondToolCall.elementHandle();

    if (!narrationHandle || !toolCallHandle) {
      throw new Error('Unable to locate narration or tool call notice elements for ordering check');
    }

    const order = await narrationHandle.evaluate(
      (node, other) => node.compareDocumentPosition(other),
      toolCallHandle
    );
    const DOCUMENT_POSITION_FOLLOWING = 4;
    expect(order & DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
