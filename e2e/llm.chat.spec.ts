import { test, expect } from './fixtures/auth.fixture';
import { ollamaChatMocks } from './mocks/ollamaChatMocks';
import { OllamaPage } from './pages/ollama.page';

test.describe('Ollama Chat', () => {
  let ollamaPage: OllamaPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    ollamaPage = new OllamaPage(authenticatedPage.page);
  });

  test('should display chat messages with markdown formatting', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSuccess(authenticatedPage.page);
    await ollamaPage.goto();
    await ollamaPage.openChatTab();

    // when
    await ollamaPage.sendChatMessage('Test message');

    // then
    await expect(ollamaPage.getChatMessage('user')).toContainText('Test message');
    await expect(ollamaPage.getChatMessage('assistant')).toContainText('Heading');
    await expect(ollamaPage.getChatMarkdownElement('h1')).toContainText('Heading');
    await expect(ollamaPage.getChatMarkdownElement('ul > li')).toHaveCount(2);
  });

  test('should initialize with default model and allow model change', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockSuccess(authenticatedPage.page);
    await ollamaPage.goto();
    await ollamaPage.openChatTab();

    // when
    await expect(ollamaPage.modelInput).toHaveValue('llama3.2:1b');
    await ollamaPage.sendChatMessage('Test message', 'mistral:7b');

    // then
    await expect(ollamaPage.modelInput).toHaveValue('mistral:7b');
    await expect(ollamaPage.getChatMessage('user')).toContainText('Test message');
  });

  test('should handle streaming errors gracefully', async ({ authenticatedPage }) => {
    // given
    await ollamaChatMocks.mockError(authenticatedPage.page);
    await ollamaPage.goto();
    await ollamaPage.openChatTab();

    // when
    await ollamaPage.sendChatMessage('Test message');

    // then
    await expect(ollamaPage.errorMessage).toBeVisible();
    await expect(ollamaPage.messageInput).toBeEnabled();
  });

  test('should include full conversation history in subsequent requests', async ({ authenticatedPage }) => {
    // given
    let secondRequest: any;

    await ollamaChatMocks.mockConversation(authenticatedPage.page, async (route) => {
      secondRequest = JSON.parse(route.request().postData() || '{}');
    });

    await ollamaPage.goto();
    await ollamaPage.openChatTab();

    // when
    await ollamaPage.sendChatMessage('What is love? Answer in 1 word');
    await expect(ollamaPage.getChatMessage('assistant')).toContainText('Love is emotion');
    await ollamaPage.sendChatMessage('yes, go on');

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
}); 