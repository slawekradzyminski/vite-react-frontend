import { test, expect } from '../fixtures/auth.fixture';
import { ChatPage } from '../pages/chat.page.object';
import { ollamaChatMocks } from '../mocks/ollamaChatMocks';
import { fulfillWithSchema } from '../mocks/backendContract';

const STATUS_PROMPT = 'Give me a quick status update on the Ollama mock';
const CHAT_SYSTEM_PROMPT = 'You are an engineering copilot focused on delivery-readiness checks.';

test.describe('Ollama Chat', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.page.route('**/api/v1/users/chat-system-prompt', async (route) => {
      await fulfillWithSchema(route, 'ChatSystemPromptDto', { chatSystemPrompt: CHAT_SYSTEM_PROMPT });
    });
    chatPage = new ChatPage(authenticatedPage.page);
  });

  test('responds with deterministic mock content', async () => {
    await ollamaChatMocks.mockSuccess(chatPage.page);
    await chatPage.goto();
    await chatPage.sendChatMessage(STATUS_PROMPT);
    await chatPage.waitForChatComplete();

    await expect(chatPage.getChatMessage('user')).toContainText(STATUS_PROMPT);
    await expect(chatPage.getChatMessage('assistant')).toContainText('The Ollama mock is up on port 11434');
  });

  test('shows thinking content when enabled', async () => {
    await ollamaChatMocks.mockWithThinking(chatPage.page);
    await chatPage.goto();
    await chatPage.enableThinking();
    await chatPage.sendChatMessage(STATUS_PROMPT);
    await chatPage.waitForChatComplete();

    await expect(chatPage.thinkingToggle).toBeVisible();
    await chatPage.expandThinking();
    await expect(chatPage.thinkingContent).toContainText('Reviewing the latest notes about the local mock server');
  });

  test('exposes default model and allows editing the value', async () => {
    await chatPage.goto();
    await chatPage.expandSettings();
    await expect(chatPage.modelInput).toHaveValue('hf.co/prism-ml/Bonsai-27B-gguf:Q1_0');

    await chatPage.modelInput.fill('custom-model');
    await expect(chatPage.modelInput).toHaveValue('custom-model');
  });

  test('updates temperature label when slider changes', async () => {
    await chatPage.goto();
    await chatPage.expandSettings();
    await chatPage.setTemperature(0.3);
    await expect(chatPage.temperatureLabel).toContainText('0.30');
  });

  test('shows dedicated system prompt card and conversation pills for participants', async () => {
    await ollamaChatMocks.mockSuccess(chatPage.page);
    await chatPage.goto();
    await chatPage.expandSystemPrompt();
    await expect(chatPage.systemPromptCard).toContainText(CHAT_SYSTEM_PROMPT);
    await expect(chatPage.chatContent.getByTestId('chat-role-pill-system')).toHaveCount(0);

    await chatPage.sendChatMessage(STATUS_PROMPT);
    await chatPage.waitForChatComplete();

    // The icon pill is decorative; the visible role label next to it names the speaker (T-043).
    const userBadge = chatPage.chatContent.getByTestId('chat-role-pill-user').last();
    await expect(userBadge).toHaveAttribute('aria-hidden', 'true');
    await expect(userBadge).not.toHaveAttribute('aria-label');
    await expect(chatPage.chatContent.getByTestId('chat-message-role-user').last()).toHaveText('User');

    const assistantBadge = chatPage.chatContent.getByTestId('chat-role-pill-assistant').last();
    await expect(assistantBadge).toHaveAttribute('aria-hidden', 'true');
    await expect(chatPage.chatContent.getByTestId('chat-message-role-assistant').last()).toHaveText('Assistant');
  });
});
