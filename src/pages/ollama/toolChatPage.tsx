import { useMemo, useState } from 'react';
import { Spinner } from '../../components/ui/spinner';
import { DEFAULT_TOOL_PROMPT, useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatTranscript } from './ChatTranscript';
import { LlmSettingsPanel, SystemPromptDetails } from '../../components/llm';

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

  const toolDefinitionsContent = availableTools.length > 0 ? (
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
  ) : null;

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
        <LlmSettingsPanel
          isOpen={showSidebar}
          onToggle={() => setShowSidebar((prev) => !prev)}
          model={model}
          onModelChange={setModel}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          colorTheme="emerald"
          toggleLabel="Settings & Tools"
          toggleLabelOpen="Hide Settings"
          modelInputId="tool-model"
          temperatureInputId="tool-temperature"
          settingsPanelTestId="tool-settings-panel"
          sidebarTestId="tool-sidebar"
          toggleTestId="tool-sidebar-toggle"
          extraContent={toolDefinitionsContent}
          maxHeight="800px"
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <SystemPromptDetails
            content={systemMessage?.content ?? DEFAULT_TOOL_PROMPT}
            testId="tool-system-prompt"
          />

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
