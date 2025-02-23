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
    response,
    isGenerating,
    generate,
    model,
    setModel
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
        <label id="model-label" htmlFor="model" className="block font-medium mb-2">
          Model
        </label>
        <input
          id="model"
          type="text"
          className="w-full border rounded p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model name"
          aria-labelledby="model-label"
        />
      </div>

      <div className="mb-4">
        <label id="prompt-label" htmlFor="prompt" className="block font-medium mb-2">
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
          aria-labelledby="prompt-label"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center w-full mb-4"
        aria-label="Generate"
      >
        {isGenerating ? <Spinner size="sm" /> : 'Generate'}
      </button>

      {response && (
        <div className="border rounded p-4">
          <div className={styles.markdownContainer}>
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
