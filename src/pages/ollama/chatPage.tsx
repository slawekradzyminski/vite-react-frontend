import { useState } from 'react';
import { useOllamaChat } from '../../hooks/useOllamaChat';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import { ChatMessageDto } from '../../types/ollama';
import styles from './OllamaChat.module.css';

interface OllamaChatPageProps {
  hideTitle?: boolean;
}

export function OllamaChatPage({ hideTitle = false }: OllamaChatPageProps) {
  const [userInput, setUserInput] = useState('');
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
  } = useOllamaChat();

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
    const isSystem = message.role === 'system';
    const isUser = message.role === 'user';
    const bgColor = isSystem
      ? 'bg-gray-100'
      : isUser
      ? 'bg-blue-50'
      : 'bg-green-50';
    const alignment = isUser ? 'items-end' : 'items-start';

    return (
      <div className={`flex flex-col ${alignment} w-full mb-4`} data-testid={`chat-message-${message.role}`}>
        <div className={`${bgColor} rounded-lg px-4 py-2 max-w-[80%]`}>
          <div className="text-sm text-gray-500 mb-1" data-testid={`chat-message-role-${message.role}`}>
            {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
          </div>
          {message.thinking && (
            <details className="mb-3 text-xs text-gray-500" data-testid="thinking-toggle">
              <summary className="cursor-pointer select-none flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z"/>
                </svg>
                Thinking
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700" data-testid="thinking-content">
                <ReactMarkdown>{message.thinking}</ReactMarkdown>
              </div>
            </details>
          )}
          <div className={styles.markdownContainer} data-testid={`chat-message-content-${message.role}`}>
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
        {messages.map((msg, idx) => (
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