import { useState } from 'react';
import { useOllama } from '../../hooks/useOllama';
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
  } = useOllama();

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
    <div className="flex flex-col">
      {!hideTitle && <h1 className="text-2xl font-bold mb-4">Generate with Ollama</h1>}

      <div className="mb-4">
        <label htmlFor="model" className="block font-medium mb-2">
          Model
        </label>
        <input
          id="model"
          type="text"
          className="w-full border rounded p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model name"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="temperature" className="block font-medium mb-2">
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
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>More Focused</span>
          <span>More Creative</span>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="prompt" className="block font-medium mb-2">
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
        />
      </div>

      <div className="mb-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          {isGenerating ? <Spinner size="sm" /> : 'Generate'}
        </button>
      </div>

      {response && (
        <div className={styles.markdownContainer}>
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
