import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OllamaChatPage } from './index';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { ChatMessageDto } from '../../types/ollama';

vi.mock('../../hooks/useOllamaChat');

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));

describe('OllamaChatPage', () => {
  // given
  const mockChat = vi.fn();
  const mockSetModel = vi.fn();
  const defaultMessages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages as ChatMessageDto[],
      isChatting: false,
      chat: mockChat,
      model: 'llama3.2:1b',
      setModel: mockSetModel,
      setMessages: vi.fn()
    });
  });

  it('renders initial state correctly', () => {
    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('Chat with Ollama')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByDisplayValue('llama3.2:1b')).toBeInTheDocument();
  });

  it('handles user input and sends messages', async () => {
    // given
    render(<OllamaChatPage />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    // when
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(sendButton);

    // then
    expect(mockChat).toHaveBeenCalledWith('Hello AI');
    expect(input).toHaveValue('');
  });

  it('handles Enter key press to send message', () => {
    // given
    render(<OllamaChatPage />);
    const input = screen.getByPlaceholderText('Type your message...');

    // when
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // then
    expect(mockChat).toHaveBeenCalledWith('Hello AI');
    expect(input).toHaveValue('');
  });

  it('disables input and shows spinner while chatting', () => {
    // given
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages as ChatMessageDto[],
      isChatting: true,
      chat: mockChat,
      model: 'llama3.2:1b',
      setModel: mockSetModel,
      setMessages: vi.fn()
    });

    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled();
    expect(screen.queryByText('Send')).not.toBeInTheDocument();
    expect(document.querySelector('[role="status"]')).toBeInTheDocument(); // Spinner
  });

  it('displays conversation messages correctly', () => {
    // given
    const messages = [
      ...defaultMessages,
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: messages as ChatMessageDto[],
      isChatting: false,
      chat: mockChat,
      model: 'llama3.2:1b',
      setModel: mockSetModel,
      setMessages: vi.fn()
    });

    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('updates model when input changes', () => {
    // given
    render(<OllamaChatPage />);
    const modelInput = screen.getByDisplayValue('llama3.2:1b');

    // when
    fireEvent.change(modelInput, { target: { value: 'llama3.2:7b' } });

    // then
    expect(mockSetModel).toHaveBeenCalledWith('llama3.2:7b');
  });

  it('prevents sending empty messages', () => {
    // given
    render(<OllamaChatPage />);
    const sendButton = screen.getByText('Send');

    // when
    fireEvent.click(sendButton);

    // then
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('renders title by default', () => {
    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('Chat with Ollama')).toBeInTheDocument();
  });

  it('hides title when hideTitle prop is true', () => {
    // when
    render(<OllamaChatPage hideTitle />);

    // then
    expect(screen.queryByText('Chat with Ollama')).not.toBeInTheDocument();
  });
}); 