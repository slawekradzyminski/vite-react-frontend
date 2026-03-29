import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useOllamaGenerate } from '../../hooks/useOllamaGenerate';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import styles from './OllamaGenerate.module.css';
import { LlmSettingsPanel } from '../../components/llm';
import { Surface } from '../../components/ui/surface';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

interface OllamaGeneratePageProps {
  hideTitle?: boolean;
}

export function OllamaGeneratePage({ hideTitle = false }: OllamaGeneratePageProps) {
  const [prompt, setPrompt] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const {
    isGenerating,
    response,
    thinking,
    generate,
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink
  } = useOllamaGenerate();

  const handleGenerate = () => {
    generate(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="space-y-4" data-testid="ollama-generate-page">
      {!hideTitle && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Generate</p>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="ollama-generate-title">
            Single prompt generation
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
          settingsPanelTestId="generate-settings-panel"
          sidebarTestId="generate-sidebar"
          toggleTestId="generate-sidebar-toggle"
          showThinkingControl
          think={think}
          onThinkChange={setThink}
        />

        <Surface as="section" variant="default" padding="md" className="space-y-4">
          <div className="space-y-1.5" data-testid="prompt-container">
            <Label htmlFor="prompt" className="block text-xs uppercase tracking-[0.18em] text-slate-600" data-testid="prompt-label">
              Prompt
            </Label>
            <Textarea
              id="prompt"
              className="min-h-[120px] resize-none"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter your prompt..."
              disabled={isGenerating}
              data-testid="prompt-input"
            />
          </div>

          <div className="flex justify-end" data-testid="generate-button-container">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-4"
              data-testid="generate-button"
            >
              {isGenerating ? <Spinner size="sm" /> : (
                <>
                  Generate
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {(thinking || response) && (
            <Surface variant="inset" padding="md" className="space-y-4" data-testid="generated-response">
              {thinking && (
                <details className="rounded-[1rem] border border-amber-200 bg-amber-50/80 p-3" data-testid="thinking-result">
                  <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-amber-800">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
                    </svg>
                    Thinking trace
                  </summary>
                  <div className="mt-2 rounded-[0.95rem] border border-amber-100 bg-white p-3 text-xs text-amber-900" data-testid="thinking-content">
                    <ReactMarkdown>{thinking}</ReactMarkdown>
                  </div>
                </details>
              )}
              {response && (
                <div className={`${styles.markdownContainer} prose prose-sm text-slate-700 max-w-none`}>
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
              )}
            </Surface>
          )}
        </Surface>
      </div>
    </div>
  );
}
