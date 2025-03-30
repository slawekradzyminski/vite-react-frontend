import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { LlmPage } from './llmPage';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { useOllamaGenerate } from '../../hooks/useOllamaGenerate';

vi.mock('../../hooks/useOllamaChat');
vi.mock('../../hooks/useOllamaGenerate');

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));

vi.mock('../ollama/chatPage', () => ({
  OllamaChatPage: ({ hideTitle }: { hideTitle?: boolean }) => (
    <div data-testid="ollama-chat-page" className="flex flex-col">
      <div data-testid="model-selection" className="mb-4">
        <label data-testid="model-label" htmlFor="model" className="block font-medium mb-2">Model</label>
        <input data-testid="model-input" id="model" type="text" className="w-full border rounded p-2" placeholder="Enter model name" value="llama3.2:1b" />
      </div>
      <div data-testid="temperature-control" className="mb-4">
        <label data-testid="temperature-label" htmlFor="temperature" className="block font-medium mb-2">Temperature: 0.80</label>
        <input data-testid="temperature-slider" id="temperature" type="range" className="w-full" min="0" max="1" step="0.1" value="0.8" />
        <div className="flex justify-between text-sm text-gray-500">
          <span data-testid="temperature-focused">More Focused</span>
          <span data-testid="temperature-creative">More Creative</span>
        </div>
      </div>
      <div data-testid="chat-conversation" className="_conversationContainer_edc005" />
      <div data-testid="chat-input-container" className="flex items-end gap-2">
        <textarea data-testid="chat-input" className="flex-1 border rounded p-2 resize-none" rows={2} placeholder="Type your message..." />
        <button data-testid="chat-send-button" disabled className="px-4 py-2 bg-blue-600 text-white rounded h-[66px] disabled:opacity-50 flex items-center justify-center min-w-[80px]">Send</button>
      </div>
    </div>
  ),
}));

vi.mock('../ollama/generatePage', () => ({
  OllamaGeneratePage: ({ hideTitle }: { hideTitle?: boolean }) => (
    <div data-testid="ollama-generate-page" className="flex flex-col">
      <div data-testid="model-selection" className="mb-4">
        <label data-testid="model-label" htmlFor="model" className="block font-medium mb-2">Model</label>
        <input data-testid="model-input" id="model" type="text" className="w-full border rounded p-2" placeholder="Enter model name" value="llama3.2:1b" />
      </div>
      <div data-testid="temperature-control" className="mb-4">
        <label data-testid="temperature-label" htmlFor="temperature" className="block font-medium mb-2">Temperature: 0.80</label>
        <input data-testid="temperature-slider" id="temperature" type="range" className="w-full" min="0" max="1" step="0.1" value="0.8" />
        <div className="flex justify-between text-sm text-gray-500">
          <span data-testid="temperature-focused">More Focused</span>
          <span data-testid="temperature-creative">More Creative</span>
        </div>
      </div>
      <div data-testid="prompt-container" className="mb-4">
        <label data-testid="prompt-label" htmlFor="prompt" className="block font-medium mb-2">Prompt</label>
        <textarea data-testid="prompt-input" id="prompt" className="w-full border rounded p-2 resize-none" rows={4} placeholder="Enter your prompt..." />
      </div>
      <div data-testid="generate-button-container" className="mb-4">
        <button data-testid="generate-button" disabled className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center min-w-[100px]">Generate</button>
      </div>
    </div>
  ),
}));

describe('LlmPage', () => {
  // given
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: [],
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: vi.fn(),
      model: 'llama3.2:1b',
      setModel: vi.fn(),
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn()
    });

    vi.mocked(useOllamaGenerate).mockReturnValue({
      response: '',
      isGenerating: false,
      generate: vi.fn(),
      model: 'llama3.2:1b',
      setModel: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn()
    });
  });

  it('renders the page title', () => {
    // when
    render(<LlmPage />);

    // then
    expect(screen.getByTestId('llm-title')).toBeInTheDocument();
  });

  it('shows chat tab by default', () => {
    // when
    render(<LlmPage />);

    // then
    expect(screen.getByTestId('chat-tab')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('generate-tab')).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByTestId('chat-content')).toBeVisible();
  });

  it('switches between chat and generate tabs', async () => {
    // given
    const user = userEvent.setup();
    render(<LlmPage />);

    // when
    await user.click(screen.getByTestId('generate-tab'));

    // then
    await waitFor(() => {
      expect(screen.getByTestId('generate-tab')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('chat-tab')).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByTestId('generate-content')).toBeVisible();
    });
  });

  it('renders chat component with hidden title', () => {
    // when
    render(<LlmPage />);

    // then
    expect(screen.getByTestId('ollama-chat-page')).toBeInTheDocument();
  });

  it('renders generate component with hidden title when switched', async () => {
    // given
    const user = userEvent.setup();
    render(<LlmPage />);

    // when
    await user.click(screen.getByTestId('generate-tab'));

    // then
    await waitFor(() => {
      expect(screen.getByTestId('generate-tab')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('ollama-generate-page')).toBeInTheDocument();
    });
  });
}); 