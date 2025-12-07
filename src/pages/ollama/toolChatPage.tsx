import { useState } from 'react';
import { Spinner } from '../../components/ui/spinner';
import { useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatTranscript } from './ChatTranscript';

interface OllamaToolChatPageProps {
  hideTitle?: boolean;
}

const suggestedPrompts = [
  'How much does the iPhone 13 Pro cost right now?',
  'What is the current stock level for the Apple Watch Series 7?',
  'Do we have any information about the PlayStation 5 inventory?'
];

export function OllamaToolChatPage({ hideTitle = false }: OllamaToolChatPageProps) {
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
    toolDefinitions
  } = useOllamaToolChat();
  const availableTools = toolDefinitions ?? [];

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

  if (isLoadingSystemPrompt) {
    return (
      <div className="flex flex-col items-center justify-center h-64" data-testid="ollama-tool-chat-loading">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading system prompt...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" data-testid="ollama-tool-chat-page">
      {!hideTitle && <h1 className="text-2xl font-bold mb-4" data-testid="ollama-tool-chat-title">Live Catalog Assistant</h1>}

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 p-4" data-testid="tool-info-card">
        <div>
          <h2 className="text-lg font-semibold">Tool calling</h2>
          <p className="text-sm text-gray-600">
            This mode uses <code>qwen3:4b-instruct</code> and automatically loops through catalog tools before replying.
          </p>
        </div>
        <div className="rounded border-l-4 border-blue-400 bg-blue-50 p-3 text-sm text-blue-900">
          <p className="mb-2 font-semibold">Available tools</p>
          <ul className="mb-3 list-disc pl-5" data-testid="tool-definition-list">
            {availableTools.map((tool) => (
              <li key={tool.function.name} data-testid="tool-definition-item">
                <code>{tool.function.name}</code> – {tool.function.description}
              </li>
            ))}
          </ul>
          <p className="mb-2">Try a suggested prompt to watch the raw JSON stream before the assistant summarizes:</p>
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
      </div>

      <div className="mb-4" data-testid="model-selection">
        <label htmlFor="tool-model" className="block font-medium mb-2" data-testid="model-label">
          Model
        </label>
        <input
          id="tool-model"
          type="text"
          className="w-full border rounded p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model name"
          data-testid="model-input"
        />
      </div>

      <div className="mb-4" data-testid="temperature-control">
        <label htmlFor="tool-temperature" className="block font-medium mb-2" data-testid="temperature-label">
          Temperature: {temperature.toFixed(2)}
        </label>
        <input
          id="tool-temperature"
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

      <div className="mb-4 rounded border border-dashed border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-900" data-testid="tool-thinking-disabled">
        <div className="font-semibold mb-1">Thinking is unavailable here</div>
        <p>
          Tool calling relies on <code>qwen3:4b-instruct</code>, which does not emit <code>thinking</code> traces. Switch to the Chat or Generate tabs for chain-of-thought responses.
        </p>
      </div>

      <ChatTranscript messages={messages} />

      <div className="flex items-end gap-2" data-testid="chat-input-container">
        <textarea
          className="flex-1 border rounded p-2 resize-none"
          rows={2}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about catalog items or sports..."
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
