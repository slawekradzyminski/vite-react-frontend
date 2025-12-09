import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OllamaChatPage } from './chatPage';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { ChatMessageDto } from '../../types/ollama';

vi.mock('../../hooks/useOllamaChat');

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));

describe('OllamaChatPage', () => {
  const mockChat = vi.fn();
  const mockSetModel = vi.fn();
  const defaultMessages: ChatMessageDto[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages,
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });
  });

  it('renders initial state correctly', () => {
    render(<OllamaChatPage />);
    expect(screen.getByText('Chat with Ollama')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByDisplayValue('qwen3:0.6b')).toBeInTheDocument();
  });

  it('handles user input and sends messages', () => {
    render(<OllamaChatPage />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(sendButton);

    expect(mockChat).toHaveBeenCalledWith('Hello AI');
    expect(input).toHaveValue('');
  });

  it('handles Enter key press to send message', () => {
    render(<OllamaChatPage />);
    const input = screen.getByPlaceholderText('Type your message...');

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockChat).toHaveBeenCalledWith('Hello AI');
    expect(input).toHaveValue('');
  });

  it('disables input and shows spinner while chatting', () => {
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages,
      isChatting: true,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });

    render(<OllamaChatPage />);

    expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled();
    expect(screen.queryByText('Send')).not.toBeInTheDocument();
    expect(document.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('displays conversation messages correctly', () => {
    const messages: ChatMessageDto[] = [
      ...defaultMessages,
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];
    vi.mocked(useOllamaChat).mockReturnValue({
      messages,
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });

    render(<OllamaChatPage />);

    expect(screen.getByTestId('chat-message-role-system')).toHaveTextContent('System');
    expect(screen.getByTestId('chat-message-role-user')).toHaveTextContent('User');
    expect(screen.getByTestId('chat-message-role-assistant')).toHaveTextContent('Assistant');
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('updates model when input changes', () => {
    render(<OllamaChatPage />);
    const modelInput = screen.getByDisplayValue('qwen3:0.6b');

    fireEvent.change(modelInput, { target: { value: 'llama3.2:7b' } });

    expect(mockSetModel).toHaveBeenCalledWith('llama3.2:7b');
  });

  it('shows loading state while fetching system prompt', () => {
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages,
      isChatting: false,
      isLoadingSystemPrompt: true,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });

    render(<OllamaChatPage />);
    expect(screen.getByText('Loading system prompt...')).toBeInTheDocument();
  });

  it('prevents sending empty messages', () => {
    render(<OllamaChatPage />);
    const sendButton = screen.getByText('Send');

    fireEvent.click(sendButton);

    expect(mockChat).not.toHaveBeenCalled();
  });

  it('renders title by default and hides when requested', () => {
    const { rerender } = render(<OllamaChatPage />);
    expect(screen.getByText('Chat with Ollama')).toBeInTheDocument();

    rerender(<OllamaChatPage hideTitle />);
    expect(screen.queryByText('Chat with Ollama')).not.toBeInTheDocument();
  });

  it('shows and toggles the thinking checkbox', () => {
    const mockSetThink = vi.fn();
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages,
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: false,
      setThink: mockSetThink
    });

    render(<OllamaChatPage />);
    const checkbox = screen.getByTestId('thinking-checkbox');

    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(mockSetThink).toHaveBeenCalledWith(true);
  });

  it('renders thinking content when present', () => {
    const messagesWithThinking: ChatMessageDto[] = [
      ...defaultMessages,
      {
        role: 'assistant',
        content: 'The answer is 42.',
        thinking: 'Let me think about this carefully...'
      }
    ];
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: messagesWithThinking,
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: true,
      setThink: vi.fn()
    });

    render(<OllamaChatPage />);

    expect(screen.getByText('The answer is 42.')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-toggle')).toBeInTheDocument();

    const summary = within(screen.getByTestId('thinking-toggle')).getByText('Thinking trace');
    fireEvent.click(summary);
    expect(screen.getByText('Let me think about this carefully...')).toBeInTheDocument();
  });

  it('still renders tool call notices when backend sends them', () => {
    const messagesWithToolCall: ChatMessageDto[] = [
      ...defaultMessages,
      {
        role: 'assistant',
        content: 'Fetching product details...',
        tool_calls: [
          {
            function: {
              name: 'get_product_snapshot',
              arguments: { name: 'iPhone 13 Pro' }
            }
          }
        ]
      },
      {
        role: 'tool',
        content: '{"name":"iPhone 13 Pro","price":999.99}',
        tool_name: 'get_product_snapshot'
      }
    ];
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: messagesWithToolCall,
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:0.6b',
      setModel: mockSetModel,
      setMessages: vi.fn(),
      temperature: 0.8,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });

    render(<OllamaChatPage />);

    expect(screen.getByTestId('tool-call-notice')).toBeInTheDocument();
    expect(screen.getByTestId('tool-message')).toBeInTheDocument();
    expect(screen.getByTestId('tool-message-content')).toHaveTextContent('"price": 999.99');
  });
});
