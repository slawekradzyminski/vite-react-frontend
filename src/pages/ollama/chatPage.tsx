import { useState } from 'react';
import { useOllamaChat, DEFAULT_SYSTEM_PROMPT } from '../../hooks/useOllamaChat';
import { Spinner } from '../../components/ui/spinner';
import { ChatTranscript } from './ChatTranscript';
import { LlmSettingsPanel, SystemPromptDetails } from '../../components/llm';

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
        <LlmSettingsPanel
          isOpen={showSidebar}
          onToggle={() => setShowSidebar((prev) => !prev)}
          model={model}
          onModelChange={setModel}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          colorTheme="indigo"
          toggleLabel="Settings"
          toggleLabelOpen="Hide Settings"
          settingsPanelTestId="chat-settings-panel"
          sidebarTestId="chat-sidebar"
          toggleTestId="chat-sidebar-toggle"
          showThinkingControl
          think={think}
          onThinkChange={setThink}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <SystemPromptDetails
            content={systemMessage?.content ?? DEFAULT_SYSTEM_PROMPT}
            testId="chat-system-prompt"
          />

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
