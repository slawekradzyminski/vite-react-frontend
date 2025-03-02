import { test, expect } from '../fixtures/auth.fixture';
import { ollamaChatMocks } from '../mocks/ollamaChatMocks';
import { ChatPage } from '../pages/chat.page';

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
    await expect(chatPage.getChatMarkdownElement('ul > li')).toHaveCount(2);
  });

  test('should initialize with default model and allow model change', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSuccess(authenticatedPage.page);
    await chatPage.goto();
    await chatPage.openChatTab();

    // when
    await expect(chatPage.modelInput).toHaveValue('llama3.2:1b');
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
    expect(secondRequest.messages).toEqual([
      {
        role: 'system',
        content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.'
      },
      {
        role: 'user',
        content: 'What is love? Answer in 1 word'
      },
      {
        role: 'assistant',
        content: 'Love is emotion.'
      },
      {
        role: 'user',
        content: 'yes, go on'
      }
    ]);
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
}); 