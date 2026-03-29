import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useOllamaChat, DEFAULT_SYSTEM_PROMPT } from '../../hooks/useOllamaChat';
import { Spinner } from '../../components/ui/spinner';
import { ChatTranscript } from './ChatTranscript';
import { LlmSettingsPanel, SystemPromptDetails } from '../../components/llm';
import { Surface } from '../../components/ui/surface';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';

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
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Chat</p>
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
          colorTheme="neutral"
          toggleLabel="Settings"
          toggleLabelOpen="Hide Settings"
          settingsPanelTestId="chat-settings-panel"
          sidebarTestId="chat-sidebar"
          toggleTestId="chat-sidebar-toggle"
          showThinkingControl
          think={think}
          onThinkChange={setThink}
        />

        <Surface as="section" variant="default" padding="md" className="space-y-4">
          <SystemPromptDetails
            content={systemMessage?.content ?? DEFAULT_SYSTEM_PROMPT}
            testId="chat-system-prompt"
          />

          <ChatTranscript messages={messages} hideSystemMessage />

          <div className="flex items-end gap-2" data-testid="chat-input-container">
            <Textarea
              className="min-h-[88px] flex-1 resize-none"
              rows={2}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
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
