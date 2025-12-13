import { useState } from 'react';
import { useOllamaGenerate } from '../../hooks/useOllamaGenerate';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import styles from './OllamaGenerate.module.css';
import { LlmSettingsPanel } from '../../components/llm';

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
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Generate</p>
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
          colorTheme="rose"
          toggleLabel="Settings"
          toggleLabelOpen="Hide Settings"
          settingsPanelTestId="generate-settings-panel"
          sidebarTestId="generate-sidebar"
          toggleTestId="generate-sidebar-toggle"
          showThinkingControl
          think={think}
          onThinkChange={setThink}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="space-y-1.5" data-testid="prompt-container">
            <label htmlFor="prompt" className="block text-xs font-medium text-slate-600" data-testid="prompt-label">
              Prompt
            </label>
            <textarea
              id="prompt"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none"
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
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="generate-button"
            >
              {isGenerating ? <Spinner size="sm" /> : (
                <>
                  Generate
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {(thinking || response) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4" data-testid="generated-response">
              {thinking && (
                <details className="rounded-lg border border-amber-200 bg-amber-50 p-3" data-testid="thinking-result">
                  <summary className="cursor-pointer text-xs font-medium flex items-center gap-1.5 text-amber-800">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
                    </svg>
                    Thinking trace
                  </summary>
                  <div className="mt-2 rounded-md bg-white p-3 text-xs text-amber-900 border border-amber-100" data-testid="thinking-content">
                    <ReactMarkdown>{thinking}</ReactMarkdown>
                  </div>
                </details>
              )}
              {response && (
                <div className={`${styles.markdownContainer} prose prose-sm text-slate-700 max-w-none`}>
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
