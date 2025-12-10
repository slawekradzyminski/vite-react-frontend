import { useState } from 'react';
import { useOllamaChat, DEFAULT_SYSTEM_PROMPT } from '../../hooks/useOllamaChat';
import { Spinner } from '../../components/ui/spinner';
import { ChatTranscript } from './ChatTranscript';

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
    setThink,
    setMessages
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

  const handleReset = () => {
    setMessages([
      systemMessage ?? {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ]);
  };

  return (
    <div className="space-y-6" data-testid="ollama-chat-page">
      {!hideTitle && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Chat</p>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="ollama-chat-title">
            Conversational assistant
          </h1>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm space-y-5">
          <details
            className="rounded-2xl border border-slate-100 bg-white/80 p-4 transition"
            data-testid="chat-settings-panel"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
              Generation settings
              <span className="text-xs font-normal text-slate-500">(model, temperature, thinking)</span>
            </summary>
            <div className="mt-4 space-y-4">
              <div className="space-y-2" data-testid="model-selection">
                <label htmlFor="model" className="block text-sm font-medium text-slate-700" data-testid="model-label">
                  Model
                </label>
                <input
                  id="model"
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Enter model name"
                  data-testid="model-input"
                />
              </div>

              <div className="space-y-2" data-testid="temperature-control">
                <label htmlFor="temperature" className="block text-sm font-medium text-slate-700" data-testid="temperature-label">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full accent-indigo-600"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  data-testid="temperature-slider"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span data-testid="temperature-focused">More Focused</span>
                  <span data-testid="temperature-creative">More Creative</span>
                </div>
              </div>

              <div className="space-y-2" data-testid="thinking-control">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700" data-testid="thinking-label">
                  <input
                    type="checkbox"
                    checked={think}
                    onChange={(e) => setThink(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    data-testid="thinking-checkbox"
                  />
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z"/>
                    </svg>
                    Thinking traces
                  </div>
                </label>
                <p className="text-xs text-slate-500">Stream hidden reasoning tokens alongside the response.</p>
              </div>
            </div>
          </details>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            data-testid="chat-reset-button"
          >
            Clear conversation
          </button>
        </aside>

        <section className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm space-y-5">
          <details
            className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4"
            data-testid="chat-system-prompt"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-700">
              System prompt
              <span className="text-xs font-normal text-slate-500">View instructions</span>
            </summary>
            <div className="mt-3 text-sm text-slate-700 whitespace-pre-line">
              {systemMessage?.content ?? DEFAULT_SYSTEM_PROMPT}
            </div>
          </details>

          <ChatTranscript messages={messages} hideSystemMessage />

          <div className="flex items-end gap-3" data-testid="chat-input-container">
            <textarea
              className="flex-1 rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
              rows={3}
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
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-60"
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
