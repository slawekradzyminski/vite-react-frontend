import { useState } from 'react';
import { useToast } from './useToast';
import { GenerateRequestDto } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { ollama } from '../lib/api';

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  context: number[] | null;
  created_at: string;
  total_duration: number | null;
}

interface UseOllamaGenerateOptions {
  onError?: (error: Error) => void;
}

export function useOllamaGenerate(options?: UseOllamaGenerateOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [model, setModel] = useState('qwen3:0.6b');
  const [temperature, setTemperature] = useState(0.8);
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
        model,
        prompt,
        options: { temperature },
      };

      const res = await ollama.generate(requestBody);

      await processSSEResponse<OllamaGenerateResponse>(res, {
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
    model,
    setModel,
    temperature,
    setTemperature,
  };
} 