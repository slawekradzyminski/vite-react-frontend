import { useMemo, useState } from 'react';
import { Spinner } from '../../components/ui/spinner';
import { DEFAULT_TOOL_PROMPT, useOllamaToolChat } from '../../hooks/useOllamaToolChat';
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
  const systemMessage = messages.find((msg) => msg.role === 'system');

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
    <div className="space-y-6" data-testid="ollama-tool-chat-page">
      {!hideTitle && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">Tools</p>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="ollama-tool-chat-title">
            Catalog-grounded assistant
          </h1>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[360px,minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm space-y-6">
          {availableTools.length > 0 && (
            <div
              className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 space-y-3"
              data-testid="tool-info-card"
            >
              <button
                type="button"
                className="text-xs font-semibold text-emerald-800 hover:underline"
                onClick={() => setShowToolSchema((prev) => !prev)}
                data-testid="tool-schema-toggle"
              >
                {showToolSchema ? 'Hide tool definition JSON' : 'Show tool definition JSON'}
              </button>
              {showToolSchema && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded bg-white/90 p-3 text-xs text-slate-800 shadow-inner" data-testid="tool-definition-json">
                  {prettyToolDefinitions}
                </pre>
              )}
            </div>
          )}

          <details
            className="rounded-2xl border border-slate-100 bg-white/80 p-4"
            data-testid="tool-settings-panel"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
              Generation settings
              <span className="text-xs font-normal text-slate-500">(model, temperature)</span>
            </summary>
            <div className="mt-4 space-y-4">
              <div className="space-y-2" data-testid="model-selection">
                <label htmlFor="tool-model" className="block text-sm font-medium text-slate-700" data-testid="model-label">
                  Model
                </label>
                <input
                  id="tool-model"
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Enter model name"
                  data-testid="model-input"
                />
              </div>

              <div className="space-y-2" data-testid="temperature-control">
                <label htmlFor="tool-temperature" className="block text-sm font-medium text-slate-700" data-testid="temperature-label">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <input
                  id="tool-temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full accent-emerald-500"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  data-testid="temperature-slider"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span data-testid="temperature-focused">More Focused</span>
                  <span data-testid="temperature-creative">More Creative</span>
                </div>
              </div>
            </div>
          </details>
        </aside>

        <section className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-emerald-50/60 p-6 shadow-sm space-y-5">
          <details
            className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4"
            data-testid="tool-system-prompt"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
              System prompt
              <span className="text-xs font-normal text-slate-500">View instructions</span>
            </summary>
            <div className="mt-3 text-sm text-slate-700 whitespace-pre-line">
              {systemMessage?.content ?? DEFAULT_TOOL_PROMPT}
            </div>
          </details>

          <ChatTranscript messages={messages} hideSystemMessage />

          <div className="flex items-end gap-3" data-testid="chat-input-container">
            <textarea
              className="flex-1 rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
              rows={3}
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
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60 min-w-[110px]"
              data-testid="chat-send-button"
            >
              {isChatting ? <Spinner size="sm" /> : 'Send'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
