import { useState } from 'react';
import { useOllamaGenerate } from '../../hooks/useOllamaGenerate';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import styles from './OllamaGenerate.module.css';

interface OllamaGeneratePageProps {
  hideTitle?: boolean;
}

export function OllamaGeneratePage({ hideTitle = false }: OllamaGeneratePageProps) {
  const [prompt, setPrompt] = useState('');
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
    <div className="space-y-6" data-testid="ollama-generate-page">
      {!hideTitle && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Generate</p>
          <h1 className="text-3xl font-bold text-slate-900" data-testid="ollama-generate-title">
            Single prompt generation
          </h1>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm space-y-6">
          <details
            className="rounded-2xl border border-slate-100 bg-white/80 p-4"
            data-testid="generate-settings-panel"
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
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-rose-200"
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
                  className="w-full accent-rose-500"
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
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    data-testid="thinking-checkbox"
                  />
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
                    </svg>
                    Thinking traces
                  </div>
                </label>
              </div>
            </div>
          </details>
        </aside>

        <section className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-rose-50/50 p-6 shadow-sm space-y-5">
          <div className="space-y-2" data-testid="prompt-container">
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-700" data-testid="prompt-label">
              Prompt
            </label>
            <textarea
              id="prompt"
              className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
              rows={6}
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
              className="px-5 py-3 rounded-2xl bg-rose-600 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 disabled:opacity-60 flex items-center justify-center min-w-[120px]"
              data-testid="generate-button"
            >
              {isGenerating ? <Spinner size="sm" /> : 'Generate'}
            </button>
          </div>

          {(thinking || response) && (
            <div className="rounded-2xl border border-rose-100 bg-white/90 p-4 space-y-4" data-testid="generated-response">
              {thinking && (
                <details className="text-xs text-slate-600 rounded-xl border border-amber-100 bg-amber-50/80 p-3" data-testid="thinking-result">
                  <summary className="cursor-pointer font-semibold flex items-center gap-1 text-amber-900">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
                    </svg>
                    Thinking trace
                  </summary>
                  <div className="mt-2 rounded-lg bg-white/90 p-3 text-amber-900" data-testid="thinking-content">
                    <ReactMarkdown>{thinking}</ReactMarkdown>
                  </div>
                </details>
              )}
              {response && (
                <div className={`${styles.markdownContainer} prose prose-sm text-slate-800`}>
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
