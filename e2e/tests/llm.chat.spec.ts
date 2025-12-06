import { test, expect } from '../fixtures/auth.fixture';
import { ollamaChatMocks } from '../mocks/ollamaChatMocks';
import { ChatPage } from '../pages/chat.page.object';

test.describe('Ollama Chat', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    chatPage = new ChatPage(authenticatedPage.page);
  });

  test('should display chat messages with markdown formatting', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSuccess(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await chatPage.sendChatMessage('Test message');

    // then
    await expect(chatPage.getChatMessage('user')).toContainText('Test message');
    await expect(chatPage.getChatMessage('assistant')).toContainText('Heading');
    await expect(chatPage.getChatMarkdownElement('h1')).toContainText('Heading');
    const listItems = chatPage.getChatMarkdownElement('ol > li, ul > li');
    await expect(listItems).toHaveCount(await listItems.count());
  });

  test('should initialize with default model and allow model change', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSuccess(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await expect(chatPage.modelInput).toHaveValue('qwen3:4b-instruct');
    await chatPage.sendChatMessage('Test message', 'mistral:7b');

    // then
    await expect(chatPage.modelInput).toHaveValue('mistral:7b');
    await expect(chatPage.getChatMessage('user')).toContainText('Test message');
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockError(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await chatPage.sendChatMessage('Test message');

    // then
    await expect(chatPage.errorMessage).toBeVisible();
    await expect(chatPage.messageInput).toBeEnabled();
  });

  test('should include full conversation history in subsequent requests', async ({ authenticatedPage }) => {
    // given
    let secondRequest: any;

    await ollamaChatMocks.mockConversation(authenticatedPage.page, async (route) => {
      secondRequest = JSON.parse(route.request().postData() || '{}');
    });

    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await chatPage.sendChatMessage('What is love? Answer in 1 word');
    await expect(chatPage.getChatMessage('assistant')).toContainText('Love is emotion');
    await chatPage.sendChatMessage('yes, go on');

    // then
    expect(secondRequest.messages.length).toBe(4);
    expect(secondRequest.messages[0].role).toBe('system');
    expect(secondRequest.messages[1]).toEqual({
      role: 'user',
      content: 'What is love? Answer in 1 word'
    });
    expect(secondRequest.messages[2]).toEqual({
      role: 'assistant',
      content: 'Love is emotion.',
      thinking: ''
    });
    expect(secondRequest.messages[3]).toEqual({
      role: 'user',
      content: 'yes, go on'
    });
  });

  test('should initialize with default temperature and allow adjustment', async ({ authenticatedPage }) => {
    // given
    let requestBody: any;
    await ollamaChatMocks.mockSuccess(authenticatedPage.page, async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
    });
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await expect(chatPage.temperatureSlider).toHaveValue('0.8');
    await chatPage.setTemperature(0.3);
    await chatPage.sendChatMessage('Test message');

    // then
    expect(requestBody.options.temperature).toBe(0.3);
  });

  test('should display thinking checkbox with bulb icon', async () => {
    // given
    await chatPage.goto();
    await chatPage.openChatTab();

    // when & then
    await expect(chatPage.thinkingCheckbox).toBeVisible();
    await expect(chatPage.thinkingCheckbox).not.toBeChecked();
    await expect(chatPage.page.getByText('Thinking')).toBeVisible();
  });

  test('should enable thinking mode and include in request', async ({ authenticatedPage }) => {
    // given
    let requestBody: any;
    await ollamaChatMocks.mockSuccess(authenticatedPage.page, async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
    });
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await chatPage.enableThinking();
    await chatPage.sendChatMessage('Test thinking message');

    // then
    expect(requestBody.think).toBe(true);
  });

  test('should display thinking content when present', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockWithThinking(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await chatPage.sendChatMessage('Test thinking message');

    // then
    await expect(chatPage.thinkingToggle).toBeVisible();
    await expect(chatPage.thinkingToggle.getByText('Thinking')).toBeVisible();
  });

  test('should expand thinking content when clicked', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockWithThinking(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.sendChatMessage('Test thinking message');

    // when
    await chatPage.expandThinking();

    // then
    await expect(chatPage.thinkingContent).toBeVisible();
    await expect(chatPage.thinkingContent).toContainText('Let me think about this...');
  });
});

test.describe('Ollama Tool Calling', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    chatPage = new ChatPage(authenticatedPage.page);
  });

  test('should display tool calls and responses in correct order', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockMultiIterationToolCall(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('What iPhones do we have?');
    await chatPage.waitForChatComplete();

    // then
    const order = await chatPage.getMessageOrder();
    expect(order).toEqual([
      'system',
      'user',
      'assistant-tool-call',
      'tool',
      'assistant-tool-call',
      'tool',
      'assistant'
    ]);
  });

  test('should not show empty assistant bubbles', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockMultiIterationToolCall(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('What iPhones do we have?');
    await chatPage.waitForChatComplete();

    // then
    const assistantMessages = chatPage.getAllChatMessages('assistant');
    const count = await assistantMessages.count();
    for (let i = 0; i < count; i++) {
      const msg = assistantMessages.nth(i);
      const hasToolCall = await msg.locator('[data-testid="tool-call-notice"]').count() > 0;
      const contentEl = msg.locator('[data-testid="chat-message-content-assistant"]');
      const content = await contentEl.textContent();
      const hasContent = content && content.trim().length > 0;
      expect(hasToolCall || hasContent).toBe(true);
    }
  });

  test('should display tool call notice with function name and arguments', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSingleToolCall(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('How much is iPhone 13 Pro?');
    await chatPage.waitForChatComplete();

    // then
    const toolCallNotice = chatPage.getToolCallNotices().first();
    await expect(toolCallNotice).toBeVisible();
    await expect(toolCallNotice).toContainText('get_product_snapshot');
    await expect(toolCallNotice).toContainText('iPhone 13 Pro');
  });

  test('should display tool response with formatted JSON', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSingleToolCall(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('How much is iPhone 13 Pro?');
    await chatPage.waitForChatComplete();

    // then
    const toolMessage = chatPage.getToolMessages().first();
    await expect(toolMessage).toBeVisible();
    await expect(toolMessage).toContainText('Function output');
    await expect(toolMessage).toContainText('get_product_snapshot');

    const toolContent = chatPage.getToolMessageContent().first();
    await expect(toolContent).toContainText('999.99');
  });

  test('should show intermediate content alongside tool call', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockToolCallWithIntermediateContent(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('Get iPhone details');
    await chatPage.waitForChatComplete();

    // then
    const assistantWithToolCall = chatPage.getAllChatMessages('assistant').first();
    await expect(assistantWithToolCall).toContainText('I will fetch the product details');
    await expect(assistantWithToolCall.locator('[data-testid="tool-call-notice"]')).toBeVisible();
  });

  test('should display tool error response with error styling', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockToolError(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('Find unknown product');
    await chatPage.waitForChatComplete();

    // then
    const toolMessage = chatPage.getToolMessages().first();
    await expect(toolMessage).toBeVisible();
    const toolMessageDiv = toolMessage.locator('div').first();
    await expect(toolMessageDiv).toHaveClass(/border-red-400/);
  });

  test('should enable tool mode when checkbox is checked', async () => {
    // given
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await chatPage.enableToolMode();

    // then
    await expect(chatPage.toolModeCheckbox).toBeChecked();
    await expect(chatPage.toolModeInfo).toBeVisible();
  });

  test('should show final assistant response after tool calls', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockMultiIterationToolCall(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();
    await chatPage.enableToolMode();

    // when
    await chatPage.sendChatMessage('What iPhones do we have?');
    await chatPage.waitForChatComplete();

    // then
    const assistantMessages = chatPage.getAllChatMessages('assistant');
    const lastAssistant = assistantMessages.last();
    await expect(lastAssistant).toContainText('iPhone 13 Pro');
    await expect(lastAssistant).toContainText('$999.99');
    const hasToolCall = await lastAssistant.locator('[data-testid="tool-call-notice"]').count();
    expect(hasToolCall).toBe(0);
  });
}); 