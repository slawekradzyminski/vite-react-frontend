import { test, expect } from '../fixtures/auth.fixture';
import { ToolChatPage } from '../pages/toolChat.page.object';
import { ollamaChatMocks } from '../mocks/ollamaChatMocks';

const TOOL_PROMPT = 'What iphones do we have available? Tell me the details about them';
const NARRATION_PROMPT =
  'Walk me through a two-step catalog lookup where you narrate between tool calls';
const TOOL_SYSTEM_PROMPT = 'You are a shopping copilot that must ground every answer in tool output.';
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_product_snapshot',
      description: 'Fetch details for a single product.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'number' },
        },
      },
    },
  },
];

test.describe('Ollama Tool Calling', () => {
  let toolChatPage: ToolChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.page.route('**/api/v1/users/tool-system-prompt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ toolSystemPrompt: TOOL_SYSTEM_PROMPT }),
      });
    });
    await authenticatedPage.page.route('**/api/v1/ollama/chat/tools/definitions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TOOL_DEFINITIONS),
      });
    });
    toolChatPage = new ToolChatPage(authenticatedPage.page);
  });

  test('shows tool info and available functions', async () => {
    await toolChatPage.goto();
    await toolChatPage.expandSettings();
    await expect(toolChatPage.toolDefinitionJson).toContainText('get_product_snapshot');
    await expect(toolChatPage.modelInput).toHaveValue('qwen3.5:2b');
    await expect(toolChatPage.thinkingCheckbox).not.toBeChecked();
  });

  test('streams tool calls and final summary from the mock', async () => {
    await ollamaChatMocks.mockSingleToolCall(toolChatPage.page);
    await toolChatPage.goto();
    await toolChatPage.sendChatMessage(TOOL_PROMPT);
    await toolChatPage.waitForChatComplete();

    await expect(toolChatPage.getToolCallNotices().first()).toContainText('get_product_snapshot');
    await expect(toolChatPage.getToolMessages().first()).toContainText('Function output');
    await expect(toolChatPage.getToolMessages().last()).toContainText('"price": 999');
    await expect(toolChatPage.chatContent.getByTestId('chat-message-assistant').last()).toContainText('iPhone 13 Pro');
  });

  test('allows adjusting the temperature slider', async () => {
    await toolChatPage.goto();
    await toolChatPage.expandSettings();
    await toolChatPage.setTemperature(0.2);
    await expect(toolChatPage.temperatureLabel).toContainText('0.20');
  });

  test('places narration before the second tool call notice', async () => {
    await ollamaChatMocks.mockToolCallWithIntermediateContent(toolChatPage.page);
    await toolChatPage.goto();
    await toolChatPage.sendChatMessage(NARRATION_PROMPT);
    await toolChatPage.waitForChatComplete();

    await expect(toolChatPage.getToolCallNotices()).toHaveCount(1);

    const narrationBlock = toolChatPage.chatContent
      .getByTestId('chat-message-content-assistant')
      .filter({ hasText: 'I will fetch the product details for you.' })
      .first();
    await expect(narrationBlock).toBeVisible();

    const secondToolCall = toolChatPage.getToolCallNotices().first();
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
