import { useState } from 'react';
import { useToast } from './useToast';
import { GenerateRequestDto } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { ollama } from '../lib/api';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context: number[] | null;
  created_at: string;
  total_duration: number | null;
}

interface UseOllamaOptions {
  onError?: (error: Error) => void;
}

export function useOllama(options?: UseOllamaOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const { toast } = useToast();

  const generate = async (prompt: string) => {
    if (!prompt.trim()) {
      toast({
        variant: 'error',
        description: 'Please enter a prompt',
      });
      return;
    }

    setIsGenerating(true);
    setResponse(''); 

    try {
      const requestBody: GenerateRequestDto = {
        model: 'gemma:2b',
        prompt,
        options: { temperature: 0 },
      };

      const res = await ollama.generate(requestBody);

      await processSSEResponse<OllamaResponse>(res, {
        onMessage: (data) => {
          if (data.response) {
            setResponse(prev => prev + data.response);
          }
          if (data.done) {
            setIsGenerating(false);
          }
        },
        onError: (error) => {
          console.error('SSE processing error:', error);
          options?.onError?.(error);
          toast({
            variant: 'error',
            description: 'Failed to process response',
          });
        },
        onComplete: () => {
          setIsGenerating(false);
        },
      });
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate response';
      toast({
        variant: 'error',
        description: errorMessage,
      });
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    response,
    generate,
  };
} 