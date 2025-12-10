import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OllamaToolChatPage } from './toolChatPage';
import { useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatMessageDto, OllamaToolDefinition } from '../../types/ollama';

vi.mock('../../hooks/useOllamaToolChat');

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>
}));

describe('OllamaToolChatPage', () => {
  const mockChat = vi.fn();
  const mockSetModel = vi.fn();
  const mockSetTemperature = vi.fn();
  const mockSetMessages = vi.fn();
  const defaultMessages: ChatMessageDto[] = [
    { role: 'system', content: 'Use catalog + Grokipedia tools.' }
  ];
  const defaultToolDefinitions: OllamaToolDefinition[] = [
    {
      type: 'function',
      function: {
        name: 'list_products',
        description: 'List products that match filters.',
        parameters: { type: 'object', properties: {} }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOllamaToolChat).mockReturnValue({
      messages: defaultMessages,
      toolMessages: [],
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:4b-instruct',
      setModel: mockSetModel,
      setMessages: mockSetMessages,
      temperature: 0.4,
      setTemperature: mockSetTemperature,
      think: false,
      setThink: vi.fn(),
      toolDefinitions: defaultToolDefinitions
    });
  });

  const openSettingsPanel = () => {
    const summary = screen.getByTestId('tool-settings-panel').querySelector('summary');
    if (summary) {
      fireEvent.click(summary);
    }
  };

  it('renders title, info card, and default model', () => {
    render(<OllamaToolChatPage />);

    expect(screen.getByText('Catalog-grounded assistant')).toBeInTheDocument();
    expect(screen.getByTestId('tool-info-card')).toBeInTheDocument();
    expect(screen.getByTestId('tool-schema-toggle')).toBeInTheDocument();
    openSettingsPanel();
    expect(screen.getByDisplayValue('qwen3:4b-instruct')).toBeInTheDocument();
  });

  it('sends chat messages through the tool hook', () => {
    render(<OllamaToolChatPage />);
    const input = screen.getByPlaceholderText('Ask about catalog items or sports...');

    fireEvent.change(input, { target: { value: 'Show me iPhones' } });
    fireEvent.click(screen.getByText('Send'));

    expect(mockChat).toHaveBeenCalledWith('Show me iPhones');
    expect(input).toHaveValue('');
  });

  it('allows adjusting the model and temperature', () => {
    render(<OllamaToolChatPage />);
    openSettingsPanel();
    const modelInput = screen.getByDisplayValue('qwen3:4b-instruct');
    const temperatureSlider = screen.getByTestId('temperature-slider');

    fireEvent.change(modelInput, { target: { value: 'custom-model' } });
    fireEvent.change(temperatureSlider, { target: { value: '0.7' } });

    expect(mockSetModel).toHaveBeenCalledWith('custom-model');
    expect(mockSetTemperature).toHaveBeenCalledWith(0.7);
  });

  it('allows expanding tool definition JSON', () => {
    render(<OllamaToolChatPage />);
    const toggle = screen.getByTestId('tool-schema-toggle');
    fireEvent.click(toggle);
    expect(screen.getByTestId('tool-definition-json')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId('tool-definition-json')).not.toBeInTheDocument();
  });

  it('shows loading state before system prompt loads', () => {
    vi.mocked(useOllamaToolChat).mockReturnValue({
      messages: defaultMessages,
      toolMessages: [],
      isChatting: false,
      isLoadingSystemPrompt: true,
      chat: mockChat,
      model: 'qwen3:4b-instruct',
      setModel: mockSetModel,
      setMessages: mockSetMessages,
      temperature: 0.4,
      setTemperature: mockSetTemperature,
      think: false,
      setThink: vi.fn(),
      toolDefinitions: defaultToolDefinitions
    });

    render(<OllamaToolChatPage />);
    expect(screen.getByTestId('ollama-tool-chat-loading')).toBeInTheDocument();
  });

  it('renders tool call notices and tool output in the transcript', () => {
    const messagesWithTools: ChatMessageDto[] = [
      ...defaultMessages,
      {
        role: 'assistant',
        content: 'Let me check the catalog.',
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
        tool_name: 'get_product_snapshot',
        content: '{"name":"iPhone 13 Pro","price":999.99}'
      }
    ];

    vi.mocked(useOllamaToolChat).mockReturnValue({
      messages: messagesWithTools,
      toolMessages: [],
      isChatting: false,
      isLoadingSystemPrompt: false,
      chat: mockChat,
      model: 'qwen3:4b-instruct',
      setModel: mockSetModel,
      setMessages: mockSetMessages,
      temperature: 0.4,
      setTemperature: mockSetTemperature,
      think: false,
      setThink: vi.fn(),
      toolDefinitions: defaultToolDefinitions
    });

    render(<OllamaToolChatPage />);
    expect(screen.getByTestId('tool-call-notice')).toBeInTheDocument();
    expect(screen.getByTestId('tool-message-content')).toHaveTextContent(/"price":\s*999\.99/);
  });

  it('hides the tool definition JSON by default', () => {
    render(<OllamaToolChatPage />);
    expect(screen.queryByTestId('tool-definition-json')).not.toBeInTheDocument();
  });
});
