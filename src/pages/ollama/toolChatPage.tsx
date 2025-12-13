import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { Spinner } from '../../components/ui/spinner';
import { DEFAULT_TOOL_PROMPT, useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatTranscript } from './ChatTranscript';

interface OllamaToolChatPageProps {
  hideTitle?: boolean;
}

export function OllamaToolChatPage({ hideTitle = false }: OllamaToolChatPageProps) {
  const [userInput, setUserInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
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
    <div className="space-y-4" data-testid="ollama-tool-chat-page">
      {!hideTitle && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">Tools</p>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="ollama-tool-chat-title">
            Catalog-grounded assistant
          </h1>
        </div>
      )}

      <div className="space-y-4">
        <div
          className={clsx(
            'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300',
            showSidebar ? 'max-h-[800px] opacity-100' : 'max-h-0 border-transparent opacity-0'
          )}
          aria-hidden={!showSidebar}
          data-testid="tool-sidebar"
        >
          <div className="p-5 space-y-5">
            <div data-testid="tool-settings-panel" className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Generation Settings
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5" data-testid="model-selection">
                  <label htmlFor="tool-model" className="block text-xs font-medium text-slate-600" data-testid="model-label">
                    Model
                  </label>
                  <input
                    id="tool-model"
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Enter model name"
                    data-testid="model-input"
                  />
                </div>

                <div className="space-y-1.5" data-testid="temperature-control">
                  <label htmlFor="tool-temperature" className="block text-xs font-medium text-slate-600" data-testid="temperature-label">
                    Temperature: {temperature.toFixed(2)}
                  </label>
                  <input
                    id="tool-temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    className="mt-2 w-full accent-emerald-500"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    data-testid="temperature-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span data-testid="temperature-focused">Focused</span>
                    <span data-testid="temperature-creative">Creative</span>
                  </div>
                </div>
              </div>
            </div>

            {availableTools.length > 0 && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3"
                data-testid="tool-definition-json"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Available Tools
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs text-slate-700 border border-emerald-100">
                  {prettyToolDefinitions}
                </pre>
              </div>
            )}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                showSidebar
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
              data-testid="tool-sidebar-toggle"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {showSidebar ? 'Hide Settings' : 'Settings & Tools'}
              {showSidebar ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </div>

          <details
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            data-testid="tool-system-prompt"
          >
            <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              System prompt
            </summary>
            <div className="mt-2 rounded-md bg-white p-3 text-xs text-slate-600 whitespace-pre-line border border-slate-100">
              {systemMessage?.content ?? DEFAULT_TOOL_PROMPT}
            </div>
          </details>

          <ChatTranscript messages={messages} hideSystemMessage />

          <div className="flex items-end gap-2" data-testid="chat-input-container">
            <textarea
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
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
              className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="chat-send-button"
            >
              {isChatting ? <Spinner size="sm" /> : (
                <>
                  Send
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
