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
}); 