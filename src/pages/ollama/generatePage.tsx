import { useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOllamaGenerate } from '../../hooks/useOllamaGenerate';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import styles from './OllamaGenerate.module.css';

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
        <div
          className={clsx(
            'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300',
            showSidebar ? 'max-h-[500px] opacity-100' : 'max-h-0 border-transparent opacity-0'
          )}
          aria-hidden={!showSidebar}
          data-testid="generate-sidebar"
        >
          <div className="p-5 space-y-4" data-testid="generate-settings-panel">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
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
                  className="mt-2 w-full accent-rose-500"
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
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    data-testid="thinking-checkbox"
                  />
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
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
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
              data-testid="generate-sidebar-toggle"
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
