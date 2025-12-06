import { useState } from 'react';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import { ChatMessageDto } from '../../types/ollama';
import styles from './OllamaChat.module.css';

interface OllamaChatPageProps {
  hideTitle?: boolean;
}

export function OllamaChatPage({ hideTitle = false }: OllamaChatPageProps) {
  const [userInput, setUserInput] = useState('');
  const [useTools, setUseTools] = useState(false);
  const plainChat = useOllamaChat();
  const toolChat = useOllamaToolChat();
  const toolDefinitions = toolChat.toolDefinitions;
  const activeChat = useTools ? toolChat : plainChat;
  const {
    messages,
    isChatting,
    isLoadingSystemPrompt,
    chat,
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink
  } = activeChat;
  const suggestedPrompts = [
    'How much does the iPhone 13 Pro cost right now?',
    'What is the current stock level for the Apple Watch Series 7?',
    'Do we have any information about the PlayStation 5 inventory?',
    'Search Grokipedia for FC Barcelona stadium updates.',
  ];

  const handleSend = () => {
    chat(userInput);
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: ChatMessageDto) => {
    if (message.role === 'tool') {
      let formattedContent = message.content ?? '';
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(message.content ?? '');
        formattedContent = JSON.stringify(parsed, null, 2);
      } catch {
        formattedContent = message.content ?? '';
      }
      const isError =
        typeof parsed === 'object' && parsed !== null && Object.prototype.hasOwnProperty.call(parsed, 'error');
      return (
        <div className="flex flex-col items-start w-full mb-4" data-testid="tool-message">
          <div
            className={`rounded-lg border px-4 py-3 w-full ${
              isError ? 'border-red-400 bg-red-50' : 'border-emerald-400 bg-emerald-50'
            }`}
          >
            <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={isError ? 'text-red-500' : 'text-emerald-600'}
              >
                <path d="M1 21H23L12 2L1 21Z" />
                <path d="M11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="#fff" />
              </svg>
              Function output · {message.tool_name ?? 'tool'}
            </div>
            <pre className="bg-white rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap" data-testid="tool-message-content">
              {formattedContent}
            </pre>
          </div>
        </div>
      );
    }

    const role = message.role ?? 'assistant';
    const isSystem = role === 'system';
    const isUser = role === 'user';
    const bgColor = isSystem ? 'bg-gray-100' : isUser ? 'bg-blue-50' : 'bg-green-50';
    const alignment = isUser ? 'items-end' : 'items-start';
    const roleLabel = typeof role === 'string'
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : 'Message';

    return (
      <div className={`flex flex-col ${alignment} w-full mb-4`} data-testid={`chat-message-${role}`}>
        <div className={`${bgColor} rounded-lg px-4 py-2 max-w-[80%]`}>
          <div className="text-sm text-gray-500 mb-1" data-testid={`chat-message-role-${role}`}>
            {roleLabel}
          </div>
          {message.thinking && (
            <details className="mb-3 text-xs text-gray-500" data-testid="thinking-toggle">
              <summary className="cursor-pointer select-none flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
                </svg>
                Thinking
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700" data-testid="thinking-content">
                <ReactMarkdown>{message.thinking}</ReactMarkdown>
              </div>
            </details>
          )}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mb-3 rounded border border-dashed border-blue-300 bg-blue-50/80 p-3 text-xs text-blue-900" data-testid="tool-call-notice">
              <div className="font-semibold mb-2">Requesting backend function</div>
              <ul className="space-y-1">
                {message.tool_calls.map((toolCall, index) => (
                  <li key={`${toolCall.function.name}-${index}`}>
                    <span className="font-mono">{toolCall.function.name}</span>{' '}
                    <code className="bg-white/70 px-1 rounded">
                      {JSON.stringify(toolCall.function.arguments ?? {})}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles.markdownContainer} data-testid={`chat-message-content-${role}`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingSystemPrompt) {
    return (
      <div className="flex flex-col items-center justify-center h-64" data-testid="ollama-chat-loading">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading system prompt...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" data-testid="ollama-chat-page">
      {!hideTitle && <h1 className="text-2xl font-bold mb-4" data-testid="ollama-chat-title">Chat with Ollama</h1>}

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 p-4" data-testid="tool-toggle-card">
        <div>
          <h2 className="text-lg font-semibold">Live product data</h2>
          <p className="text-sm text-gray-600">
            When enabled the assistant can call backend tools (catalog + Grokipedia) and stream the raw JSON before responding.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium" data-testid="tool-mode-toggle">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={useTools}
            onChange={(e) => setUseTools(e.target.checked)}
            data-testid="tool-mode-checkbox"
          />
          Use live product data (function calling)
        </label>
        {useTools && (
          <div className="rounded border-l-4 border-blue-400 bg-blue-50 p-3 text-sm text-blue-900" data-testid="tool-mode-info">
            <p className="mb-2 font-semibold">Available tools</p>
            <ul className="mb-3 list-disc pl-5" data-testid="tool-definition-list">
              {toolDefinitions.map((tool) => (
                <li key={tool.function.name} data-testid="tool-definition-item">
                  <code>{tool.function.name}</code> – {tool.function.description}
                </li>
              ))}
            </ul>
            <p className="mb-2">Ask about specific products or trending sports/news to watch each function stream its output. Try a suggested prompt:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-100"
                  onClick={() => setUserInput(prompt)}
                  data-testid="suggested-prompt"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4" data-testid="model-selection">
        <label htmlFor="model" className="block font-medium mb-2" data-testid="model-label">
          Model
        </label>
        <input
          id="model"
          type="text"
          className="w-full border rounded p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model name"
          data-testid="model-input"
        />
      </div>

      <div className="mb-4" data-testid="temperature-control">
        <label htmlFor="temperature" className="block font-medium mb-2" data-testid="temperature-label">
          Temperature: {temperature.toFixed(2)}
        </label>
        <input
          id="temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          className="w-full"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          data-testid="temperature-slider"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span data-testid="temperature-focused">More Focused</span>
          <span data-testid="temperature-creative">More Creative</span>
        </div>
      </div>

      <div className="mb-4" data-testid="thinking-control">
        <label className="flex items-center gap-2 cursor-pointer" data-testid="thinking-label">
          <input
            type="checkbox"
            checked={think}
            onChange={(e) => setThink(e.target.checked)}
            className="rounded border-gray-300"
            data-testid="thinking-checkbox"
          />
          <div className="flex items-center gap-1 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z"/>
            </svg>
            Thinking
          </div>
        </label>
      </div>

      <div className={styles.conversationContainer} data-testid="chat-conversation">
        {messages
          .filter((msg) => {
            if (msg.role === 'assistant') {
              const hasContent = msg.content && msg.content.trim().length > 0;
              const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
              const hasThinking = msg.thinking && msg.thinking.trim().length > 0;
              return hasContent || hasToolCalls || hasThinking;
            }
            return true;
          })
          .map((msg, idx) => (
            <div key={idx} data-testid={`chat-message-container-${idx}`}>{renderMessage(msg)}</div>
          ))}
      </div>

      <div className="flex items-end gap-2" data-testid="chat-input-container">
        <textarea
          className="flex-1 border rounded p-2 resize-none"
          rows={2}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={isChatting}
          data-testid="chat-input"
        />
        <button
          onClick={handleSend}
          disabled={isChatting || !userInput.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded h-[66px] disabled:opacity-50 flex items-center justify-center min-w-[80px]"
          data-testid="chat-send-button"
        >
          {isChatting ? <Spinner size="sm" /> : 'Send'}
        </button>
      </div>
    </div>
  );
} 
