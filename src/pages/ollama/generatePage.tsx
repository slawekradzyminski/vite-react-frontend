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
    generate,
    model,
    setModel,
    temperature,
    setTemperature
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

      {response && (
        <div className={styles.markdownContainer} data-testid="generated-response">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
} 