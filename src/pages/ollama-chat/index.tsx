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
      <div className={`flex flex-col ${alignment} w-full mb-4`}>
        <div className={`${bgColor} rounded-lg px-4 py-2 max-w-[80%]`}>
          <div className="text-sm text-gray-500 mb-1">
            {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
          </div>
          <div className={styles.markdownContainer}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {!hideTitle && <h1 className="text-2xl font-bold mb-4">Chat with Ollama</h1>}

      <div className="mb-4">
        <label htmlFor="model" className="block font-medium mb-2">
          Model
        </label>
        <input
          id="model"
          type="text"
          className="w-full border rounded p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model name"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="temperature" className="block font-medium mb-2">
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
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>More Focused</span>
          <span>More Creative</span>
        </div>
      </div>

      <div className={styles.conversationContainer}>
        {messages.map((msg, idx) => (
          <div key={idx}>{renderMessage(msg)}</div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 border rounded p-2 resize-none"
          rows={2}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={isChatting}
        />
        <button
          onClick={handleSend}
          disabled={isChatting || !userInput.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded h-[66px] disabled:opacity-50 flex items-center justify-center min-w-[80px]"
        >
          {isChatting ? <Spinner size="sm" /> : 'Send'}
        </button>
      </div>
    </div>
  );
}
