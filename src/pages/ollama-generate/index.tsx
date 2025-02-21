import React, { useState } from 'react';
import { GenerateRequestDto } from '../../types/ollama';
import { useToast } from '../../hooks/toast';

export function OllamaGeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'error',
        description: 'Please enter a prompt',
      });
      return;
    }

    setIsGenerating(true);
    setResponse(''); // Clear previous response

    try {
      const requestBody: GenerateRequestDto = {
        model: 'gemma:2b',
        prompt,
        options: { temperature: 0 },
      };

      // Post to your SSE endpoint
      const res = await fetch('http://localhost:4001/api/ollama/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok || !res.body) {
        if (res.status === 401) {
          toast({
            variant: 'error',
            description: 'Please log in to use this feature',
          });
          return;
        }
        throw new Error(`Failed to fetch stream: ${res.statusText}`);
      }

      // Read the streamed body via a reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = ''; // accumulate partial text here

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          // Decode the chunk to string
          const chunkText = decoder.decode(value, { stream: true });
          buffer += chunkText;  // add to our running buffer

          // Split on double-newline to get complete SSE events
          const events = buffer.split('\n\n');
          // Save the last partial piece in buffer
          buffer = events.pop() ?? '';

          // Process each complete event
          for (const eventBlock of events) {
            // Each event block has multiple lines, each starting with "data:"
            // We need to join them and remove the "data:" prefixes
            const jsonString = eventBlock
              .split('\n')
              .map(line => line.replace(/^data:/, '').trim())
              .join('')
              .trim();

            if (!jsonString) continue;

            try {
              const sseData = JSON.parse(jsonString);
              if (sseData.response) {
                setResponse(prev => prev + sseData.response);
              }
              if (sseData.done) {
                await reader.cancel();
                done = true;
                break;
              }
            } catch (err) {
              console.error('Failed to parse SSE JSON', err, jsonString);
              // Continue processing other events
            }
          }
        }
      }

      // Process any remaining complete event in the buffer
      if (buffer.trim()) {
        const jsonString = buffer
          .split('\n')
          .map(line => line.replace(/^data:/, '').trim())
          .join('')
          .trim();

        if (jsonString) {
          try {
            const sseData = JSON.parse(jsonString);
            if (sseData.response) {
              setResponse(prev => prev + sseData.response);
            }
          } catch (err) {
            console.debug('Failed to parse final SSE chunk', err);
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      toast({
        variant: 'error',
        description: error instanceof Error ? error.message : 'Failed to generate response',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Single Prompt to Ollama</h1>

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
        <label className="block font-medium mb-2">Response</label>
        <div 
          className={`w-full min-h-[100px] border rounded p-2 whitespace-pre-wrap ${isGenerating ? 'animate-pulse' : ''}`}
        >
          {response || (isGenerating ? 'Generating response...' : 'Response will appear here')}
        </div>
      </div>
    </div>
  );
}
