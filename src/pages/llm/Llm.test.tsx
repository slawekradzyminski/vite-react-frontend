import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { LlmPage } from '.';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { useOllama } from '../../hooks/useOllama';

// Mock the hooks
vi.mock('../../hooks/useOllamaChat');
vi.mock('../../hooks/useOllama');

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));

vi.mock('../ollama-chat', () => ({
  OllamaChatPage: ({ hideTitle }: { hideTitle?: boolean }) => (
    <div>Chat Component {hideTitle ? '(no title)' : ''}</div>
  ),
}));

vi.mock('../ollama-generate', () => ({
  OllamaGeneratePage: ({ hideTitle }: { hideTitle?: boolean }) => (
    <div>Generate Component {hideTitle ? '(no title)' : ''}</div>
  ),
}));

describe('LlmPage', () => {
  // given
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: [],
      isChatting: false,
      chat: vi.fn(),
      model: 'llama3.2:1b',
      setModel: vi.fn(),
      setMessages: vi.fn()
    });

    vi.mocked(useOllama).mockReturnValue({
      response: '',
      isGenerating: false,
      generate: vi.fn(),
      model: 'llama3.2:1b',
      setModel: vi.fn()
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
    expect(screen.getByText('Chat Component (no title)')).toBeInTheDocument();
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
      expect(screen.getByText('Generate Component (no title)')).toBeInTheDocument();
    });
  });
}); 