import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Spinner } from '../../components/ui/spinner';
import { DEFAULT_TOOL_PROMPT, useOllamaToolChat } from '../../hooks/useOllamaToolChat';
import { ChatTranscript } from './ChatTranscript';
import { LlmSettingsPanel, SystemPromptDetails } from '../../components/llm';
import { Surface } from '../../components/ui/surface';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';

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
    think,
    setThink,
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
    <Surface
      variant="inset"
      padding="md"
      className="space-y-3"
      data-testid="tool-definition-json"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        Available Tools
      </div>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[1rem] border border-stone-200 bg-white p-3 text-xs text-slate-700">
        {prettyToolDefinitions}
      </pre>
    </Surface>
  ) : null;

  return (
    <div className="space-y-4" data-testid="ollama-tool-chat-page">
      {!hideTitle && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Tools</p>
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
          colorTheme="neutral"
          toggleLabel="Settings & Tools"
          toggleLabelOpen="Hide Settings"
          modelInputId="tool-model"
          temperatureInputId="tool-temperature"
          settingsPanelTestId="tool-settings-panel"
          sidebarTestId="tool-sidebar"
          toggleTestId="tool-sidebar-toggle"
          showThinkingControl
          think={think}
          onThinkChange={setThink}
          extraContent={toolDefinitionsContent}
          maxHeight="800px"
        />

        <Surface as="section" variant="default" padding="md" className="space-y-4">
          <SystemPromptDetails
            content={systemMessage?.content ?? DEFAULT_TOOL_PROMPT}
            testId="tool-system-prompt"
          />

          <ChatTranscript messages={messages} hideSystemMessage />

          <div className="flex items-end gap-2" data-testid="chat-input-container">
            <Textarea
              className="min-h-[88px] flex-1 resize-none"
              rows={2}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about catalog items or sports..."
              disabled={isChatting}
              data-testid="chat-input"
            />
            <Button
              onClick={handleSend}
              disabled={isChatting || !userInput.trim()}
              className="h-11 px-4"
              data-testid="chat-send-button"
            >
              {isChatting ? <Spinner size="sm" /> : (
                <>
                  Send
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
