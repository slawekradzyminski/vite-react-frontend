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
    setTemperature
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