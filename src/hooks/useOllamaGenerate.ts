import { useState } from 'react';
import { useToast } from './useToast';
import { GenerateRequestDto } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { ollama } from '../lib/api';
import { useInFlightRequest, useOllamaParams } from './useOllamaParams';

interface OllamaGenerateResponse {
  model: string;
  response: string;
  thinking?: string;
  done: boolean;
  context: number[] | null;
  created_at: string;
  total_duration: number | null;
}

interface UseOllamaGenerateOptions {
  onError?: (error: Error) => void;
}

export function useOllamaGenerate(options?: UseOllamaGenerateOptions) {
  const { inFlight: isGenerating, start, stop } = useInFlightRequest(false);
  const [response, setResponse] = useState('');
  const [thinking, setThinking] = useState('');
  const {
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink,
  } = useOllamaParams({ model: 'qwen3:0.6b', temperature: 0.8, think: false });
  const { toast } = useToast();

  const generate = async (prompt: string) => {
    if (!prompt.trim()) {
      toast({
        variant: 'error',
        description: 'Please enter a prompt',
      });
      return;
    }

    const started = start(() => {
      toast({
        variant: 'error',
        description: 'Please wait for the current response to finish.',
      });
    });

    if (!started) {
      return;
    }

    setResponse(''); 
    setThinking('');

    try {
      const requestBody: GenerateRequestDto = {
        model,
        prompt,
        think,
        options: { temperature },
      };

      const res = await ollama.generate(requestBody);

      await processSSEResponse<OllamaGenerateResponse>(res, {
        onMessage: (data) => {
          if (data.response) {
            setResponse(prev => prev + data.response);
          }
          if (data.thinking) {
            setThinking(prev => prev + data.thinking);
          }
          if (data.done) {
            stop();
          }
        },
        onError: (error) => {
          console.error('SSE processing error:', error);
          options?.onError?.(error);
          toast({
            variant: 'error',
            description: 'Failed to process response',
          });
          stop();
        },
        onComplete: () => {
          stop();
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
      stop();
    }
  };

  return {
    isGenerating,
    response,
    thinking,
    generate,
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink,
  };
} 
