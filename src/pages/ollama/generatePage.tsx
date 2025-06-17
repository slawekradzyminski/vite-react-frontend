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
    <div className="flex flex-col" data-testid="ollama-generate-page">
      {!hideTitle && <h1 className="text-2xl font-bold mb-4" data-testid="ollama-generate-title">Generate with Ollama</h1>}

      <div className="mb-4" data-testid="model-selection">
        <label htmlFor="model" className="block font-medium mb-2" data-testid="model-label">
          Model
        </label>
        <input
          id="model"
          type="text"
          className="w-full border rounded p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model name"
          data-testid="model-input"
        />
      </div>

      <div className="mb-4" data-testid="temperature-control">
        <label htmlFor="temperature" className="block font-medium mb-2" data-testid="temperature-label">
          Temperature: {temperature.toFixed(2)}
        </label>
        <input
          id="temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          className="w-full"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          data-testid="temperature-slider"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span data-testid="temperature-focused">More Focused</span>
          <span data-testid="temperature-creative">More Creative</span>
        </div>
      </div>

      <div className="mb-4" data-testid="thinking-control">
        <label className="flex items-center gap-2 cursor-pointer" data-testid="thinking-label">
          <input
            type="checkbox"
            checked={think}
            onChange={(e) => setThink(e.target.checked)}
            className="rounded border-gray-300"
            data-testid="thinking-checkbox"
          />
          <div className="flex items-center gap-1 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z"/>
            </svg>
            Thinking
          </div>
        </label>
      </div>

      <div className="mb-4" data-testid="prompt-container">
        <label htmlFor="prompt" className="block font-medium mb-2" data-testid="prompt-label">
          Prompt
        </label>
        <textarea
          id="prompt"
          className="w-full border rounded p-2 resize-none"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter your prompt..."
          disabled={isGenerating}
          data-testid="prompt-input"
        />
      </div>

      <div className="mb-4" data-testid="generate-button-container">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center min-w-[100px]"
          data-testid="generate-button"
        >
          {isGenerating ? <Spinner size="sm" /> : 'Generate'}
        </button>
      </div>

      {(thinking || response) && (
        <div data-testid="generated-response">
          {thinking && (
            <details className="mb-4" data-testid="thinking-result">
              <summary className="cursor-pointer font-medium flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z"/>
                </svg>
                Thinking
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-gray-700">
                <ReactMarkdown>{thinking}</ReactMarkdown>
              </div>
            </details>
          )}
          {response && (
            <div className={styles.markdownContainer}>
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 