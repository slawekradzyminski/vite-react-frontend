import { test, expect } from '../fixtures/auth.fixture';
import { ChatPage } from '../pages/chat.page.object';

const STATUS_PROMPT = 'Give me a quick status update on the Ollama mock';

test.describe('Ollama Chat', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    chatPage = new ChatPage(authenticatedPage.page);
    await chatPage.goto();
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
    await chatPage.expandSettings();
    await expect(chatPage.modelInput).toHaveValue('qwen3:0.6b');

    await chatPage.modelInput.fill('custom-model');
    await expect(chatPage.modelInput).toHaveValue('custom-model');
  });

  test('updates temperature label when slider changes', async () => {
    await chatPage.expandSettings();
    await chatPage.setTemperature(0.3);
    await expect(chatPage.temperatureLabel).toContainText('0.30');
  });

  test('shows dedicated system prompt card and conversation pills for participants', async () => {
    await chatPage.expandSystemPrompt();
    await expect(chatPage.systemPromptCard).toContainText('You are an engineering copilot');
    await expect(chatPage.chatContent.getByTestId('chat-role-pill-system')).toHaveCount(0);

    await chatPage.sendChatMessage(STATUS_PROMPT);
    await chatPage.waitForChatComplete();

    const userBadge = chatPage.chatContent.getByTestId('chat-role-pill-user').last();
    await expect(userBadge).toHaveAttribute('aria-label', 'User');
    await expect(userBadge).toHaveText('');

    const assistantBadge = chatPage.chatContent.getByTestId('chat-role-pill-assistant').last();
    await expect(assistantBadge).toHaveAttribute('aria-label', 'Assistant');
    await expect(assistantBadge).toHaveText('');
  });
});
