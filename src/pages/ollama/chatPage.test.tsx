import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OllamaChatPage } from './chatPage';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatMessageDto } from '../../types/ollama';

vi.mock('../../hooks/useOllamaChat');
vi.mock('../../hooks/useOllamaToolChat');

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));

describe('OllamaChatPage', () => {
  // given
  const mockChat = vi.fn();
  const mockSetModel = vi.fn();
  const mockToolChat = vi.fn();
  const mockSetToolModel = vi.fn();
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
    vi.mocked(useOllamaToolChat).mockReturnValue({
      messages: defaultMessages as ChatMessageDto[],
      toolMessages: [],
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockToolChat,
      model: 'qwen3:8b',
      setModel: mockSetToolModel,
      setMessages: vi.fn(),
      temperature: 0.4,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });
  });

  it('renders initial state correctly', () => {
    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('Chat with Ollama')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByDisplayValue('qwen3:0.6b')).toBeInTheDocument();
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

  it('switches to tool mode and uses tool chat implementation', () => {
    render(<OllamaChatPage />);
    const toggle = screen.getByTestId('tool-mode-checkbox');
    fireEvent.click(toggle);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'What about iPhone 13 Pro?' } });
    fireEvent.click(sendButton);

    expect(mockToolChat).toHaveBeenCalledWith('What about iPhone 13 Pro?');
    expect(mockChat).not.toHaveBeenCalled();
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

    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('renders tool call notices and tool output when in tool mode', () => {
    const toolMessages = [
      ...defaultMessages,
      {
        role: 'assistant',
        content: '',
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

    vi.mocked(useOllamaToolChat).mockReturnValue({
      messages: toolMessages as ChatMessageDto[],
      toolMessages: [],
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockToolChat,
      model: 'qwen3:8b',
      setModel: mockSetToolModel,
      setMessages: vi.fn(),
      temperature: 0.4,
      setTemperature: vi.fn(),
      think: false,
      setThink: vi.fn()
    });

    render(<OllamaChatPage />);
    const toggle = screen.getByTestId('tool-mode-checkbox');
    fireEvent.click(toggle);

    expect(screen.getByTestId('tool-call-notice')).toBeInTheDocument();
    expect(screen.getByTestId('tool-message')).toBeInTheDocument();
    expect(screen.getByTestId('tool-message-content')).toHaveTextContent(/"price":\s*999\.99/);
  });

  it('updates model when input changes', () => {
    // given
    render(<OllamaChatPage />);
    const modelInput = screen.getByDisplayValue('qwen3:0.6b');

    // when
    fireEvent.change(modelInput, { target: { value: 'llama3.2:7b' } });

    // then
    expect(mockSetModel).toHaveBeenCalledWith('llama3.2:7b');
  });

  it('shows loading state while fetching system prompt', () => {
    // given
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages as ChatMessageDto[],
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

    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('Loading system prompt...')).toBeInTheDocument();
    // Don't check for the input element as it's not rendered during loading
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

  it('renders thinking checkbox unchecked by default', () => {
    // given

    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByTestId('thinking-checkbox')).not.toBeChecked();
    expect(screen.getByText('Thinking')).toBeInTheDocument();
  });

  it('toggles thinking checkbox when clicked', () => {
    // given
    const mockSetThink = vi.fn();
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: defaultMessages as ChatMessageDto[],
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

    // when
    fireEvent.click(checkbox);

    // then
    expect(mockSetThink).toHaveBeenCalledWith(true);
  });

  it('displays thinking content when message contains thinking field', () => {
    // given
    const messagesWithThinking = [
      ...defaultMessages,
      { 
        role: 'assistant', 
        content: 'The answer is 42.',
        thinking: 'Let me think about this carefully...'
      }
    ];
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: messagesWithThinking as ChatMessageDto[],
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

    // when
    render(<OllamaChatPage />);

    // then
    expect(screen.getByText('The answer is 42.')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-toggle')).toBeInTheDocument();
    // The thinking content should be in the DOM but hidden by the closed details element
    const thinkingContent = screen.getByText('Let me think about this carefully...');
    expect(thinkingContent).toBeInTheDocument();
  });

  it('shows thinking content when reasoning toggle is expanded', () => {
    // given
    const messagesWithThinking = [
      ...defaultMessages,
      { 
        role: 'assistant', 
        content: 'The answer is 42.',
        thinking: 'Let me think about this carefully...'
      }
    ];
    vi.mocked(useOllamaChat).mockReturnValue({
      messages: messagesWithThinking as ChatMessageDto[],
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
    const reasoningToggle = screen.getByTestId('thinking-toggle').querySelector('summary');

    // when
    fireEvent.click(reasoningToggle!);

    // then
    expect(screen.getByText('Let me think about this carefully...')).toBeInTheDocument();
  });

  it('displays thinking checkbox with bulb icon and correct text', () => {
    // given

    // when
    render(<OllamaChatPage />);

    // then
    const thinkingCheckbox = screen.getByTestId('thinking-checkbox');
    expect(thinkingCheckbox).toBeInTheDocument();
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    
    // Check that the old text is not present
    expect(screen.queryByText('Show model reasoning (think)')).not.toBeInTheDocument();
    expect(screen.queryByText('Adds <think> reasoning to the response.')).not.toBeInTheDocument();
  });
}); 
