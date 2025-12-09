import { useMemo, useState } from 'react';
import { Spinner } from '../../components/ui/spinner';
import { useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatTranscript } from './ChatTranscript';

interface OllamaToolChatPageProps {
  hideTitle?: boolean;
}

export function OllamaToolChatPage({ hideTitle = false }: OllamaToolChatPageProps) {
  const [userInput, setUserInput] = useState('');
  const [showToolSchema, setShowToolSchema] = useState(false);
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
  const prettyToolDefinitions = useMemo(
    () => JSON.stringify(availableTools, null, 2),
    [availableTools]
  );

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
      {!hideTitle && (
        <h1 className="text-2xl font-bold mb-4" data-testid="ollama-tool-chat-title">
          Live Catalog Assistant
        </h1>
      )}

      <div className="mb-6 rounded-lg border border-gray-200 p-4 space-y-3" data-testid="tool-info-card">
        <div>
          <p className="text-sm text-gray-600">
            This mode uses <code>qwen3:4b-instruct</code>, loops through catalog tools before replying, and streams tool call
            output back into the conversation.
          </p>
        </div>
        {availableTools.length > 0 && (
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">Available tools</p>
            <ul className="list-disc pl-5 space-y-1" data-testid="tool-definition-list">
              {availableTools.map((tool) => (
                <li key={tool.function.name} data-testid="tool-definition-item">
                  <code>{tool.function.name}</code> – {tool.function.description}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-blue-700 hover:underline"
              onClick={() => setShowToolSchema((prev) => !prev)}
              data-testid="tool-schema-toggle"
            >
              {showToolSchema ? 'Hide tool definition JSON' : 'Show tool definition JSON'}
            </button>
            {showToolSchema && (
              <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800" data-testid="tool-definition-json">
                {prettyToolDefinitions}
              </pre>
            )}
          </div>
        )}
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
