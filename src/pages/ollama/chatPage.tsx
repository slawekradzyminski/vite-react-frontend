import { useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOllamaChat, DEFAULT_SYSTEM_PROMPT } from '../../hooks/useOllamaChat';
import { Spinner } from '../../components/ui/spinner';
import { ChatTranscript } from './ChatTranscript';

interface OllamaChatPageProps {
  hideTitle?: boolean;
}

export function OllamaChatPage({ hideTitle = false }: OllamaChatPageProps) {
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
    think,
    setThink,
  } = useOllamaChat();

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
      <div className="flex flex-col items-center justify-center h-64" data-testid="ollama-chat-loading">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading system prompt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ollama-chat-page">
      {!hideTitle && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Chat</p>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="ollama-chat-title">
            Conversational assistant
          </h1>
        </div>
      )}

      <div className="space-y-4">
        <div
          className={clsx(
            'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300',
            showSidebar ? 'max-h-[500px] opacity-100' : 'max-h-0 border-transparent opacity-0'
          )}
          aria-hidden={!showSidebar}
          data-testid="chat-sidebar"
        >
          <div className="p-5 space-y-4" data-testid="chat-settings-panel">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Generation Settings
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5" data-testid="model-selection">
                <label htmlFor="model" className="block text-xs font-medium text-slate-600" data-testid="model-label">
                  Model
                </label>
                <input
                  id="model"
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Enter model name"
                  data-testid="model-input"
                />
              </div>

              <div className="space-y-1.5" data-testid="temperature-control">
                <label htmlFor="temperature" className="block text-xs font-medium text-slate-600" data-testid="temperature-label">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="mt-2 w-full accent-indigo-600"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  data-testid="temperature-slider"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span data-testid="temperature-focused">Focused</span>
                  <span data-testid="temperature-creative">Creative</span>
                </div>
              </div>

              <div className="flex items-center" data-testid="thinking-control">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100" data-testid="thinking-label">
                  <input
                    type="checkbox"
                    checked={think}
                    onChange={(e) => setThink(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    data-testid="thinking-checkbox"
                  />
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z"/>
                    </svg>
                    <span className="text-xs font-medium text-slate-700">Thinking</span>
                  </div>
                </label>
              </div>
            </div>
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
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
              data-testid="chat-sidebar-toggle"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {showSidebar ? 'Hide Settings' : 'Settings'}
              {showSidebar ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </div>
          <details
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            data-testid="chat-system-prompt"
          >
            <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              System prompt
            </summary>
            <div className="mt-2 rounded-md bg-white p-3 text-xs text-slate-600 whitespace-pre-line border border-slate-100">
              {systemMessage?.content ?? DEFAULT_SYSTEM_PROMPT}
            </div>
          </details>

          <ChatTranscript messages={messages} hideSystemMessage />

          <div className="flex items-end gap-2" data-testid="chat-input-container">
            <textarea
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
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
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
