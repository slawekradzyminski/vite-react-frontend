import { useState } from 'react';
import { useOllama } from '../../hooks/useOllama';
import { Spinner } from '../../components/ui/spinner';
import ReactMarkdown from 'react-markdown';
import styles from './OllamaGenerate.module.css';

export function OllamaGeneratePage() {
  const [prompt, setPrompt] = useState('');
  const { isGenerating, response, generate, model, setModel } = useOllama();

  const handleGenerate = () => {
    generate(prompt);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Single Prompt to Ollama</h1>

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

      <label htmlFor="prompt" className="block font-medium mb-2">
        Prompt
      </label>
      <textarea
        id="prompt"
        className="w-full border rounded p-2"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here..."
      />

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="font-medium">Response</label>
          {isGenerating && <Spinner size="sm" />}
        </div>
        <div className="w-full min-h-[100px] border rounded p-2 whitespace-pre-wrap text-black">
          {response ? (
            <div className={styles.markdownContainer}>
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          ) : (
            'Response will appear here'
          )}
        </div>
      </div>
    </div>
  );
}
