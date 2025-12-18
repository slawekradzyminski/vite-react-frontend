import { useCallback, useEffect, useRef, useState } from 'react';
import { ollama, prompts } from '../lib/api';
import { TOOL_DEFINITIONS } from '../lib/ollamaTools';
import type { ChatMessageDto, ChatRequestDto, ChatResponseDto, OllamaToolDefinition } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { useToast } from './useToast';
import { useInFlightRequest, useOllamaParams } from './useOllamaParams';

interface UseOllamaToolChatOptions {
  onError?: (error: Error) => void;
}

export const DEFAULT_TOOL_PROMPT = `You are a tool-calling shopping assistant for our training store. Tools available:

- list_products: returns ONLY id and name for a catalog slice. Accepts offset, limit, category (e.g., "electronics"), and inStockOnly.
- get_product_snapshot: fetch one product by name or productId (id, name, description, price, stockQuantity, category, imageUrl).

Tool rules:

- Never answer from memory; ground every product fact in a tool response.
- For broad questions, call list_products first, then snapshot every product you mention.
- For specific SKUs, call get_product_snapshot before replying.
- For comparisons, retrieve list_products followed by snapshots for each SKU mentioned.
- If a product is missing, be transparent and ask for another name/id; never fabricate details.`;

const pruneNullishValues = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => pruneNullishValues(item))
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      const cleaned = pruneNullishValues(val);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    });
    return result;
  }

  return value;
};

const sanitizeToolDefinitions = (definitions: OllamaToolDefinition[]): OllamaToolDefinition[] => {
  return definitions
    .map((definition) => pruneNullishValues(definition))
    .filter((definition): definition is OllamaToolDefinition => Boolean(definition));
};

const DEFAULT_TOOL_DEFINITIONS = sanitizeToolDefinitions(TOOL_DEFINITIONS);

export function useOllamaToolChat(options?: UseOllamaToolChatOptions) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageDto[]>([
    { role: 'system', content: DEFAULT_TOOL_PROMPT },
  ]);
  const [toolMessages, setToolMessages] = useState<ChatMessageDto[]>([]);
  const { inFlight: isChatting, start, stop } = useInFlightRequest(false);
  const {
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink,
  } = useOllamaParams({ model: 'qwen3:4b-instruct', temperature: 0.4, think: false });
  const [isLoadingSystemPrompt, setIsLoadingSystemPrompt] = useState(true);
  const [toolDefinitions, setToolDefinitions] = useState<OllamaToolDefinition[]>(DEFAULT_TOOL_DEFINITIONS);

  const isStreamingAssistantRef = useRef<boolean>(false);
  const accumulatedContentRef = useRef<string>('');
  const accumulatedThinkingRef = useRef<string>('');

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        setIsLoadingSystemPrompt(true);
        const response = await prompts.tool.get();
        const toolPrompt = response.data.toolSystemPrompt?.trim();
        if (toolPrompt) {
          setMessages([{ role: 'system', content: toolPrompt }]);
        }
      } catch (error) {
        console.error('Failed to fetch tool system prompt', error);
      } finally {
        setIsLoadingSystemPrompt(false);
      }
    };
    loadPrompt();
  }, []);

  useEffect(() => {
    const loadToolDefinitions = async () => {
      try {
        const definitions = await ollama.getToolDefinitions();
        const sanitized = sanitizeToolDefinitions(definitions);
        if (sanitized.length > 0) {
          setToolDefinitions(sanitized);
        }
      } catch (error) {
        console.warn('Falling back to bundled tool definitions', error);
      }
    };
    loadToolDefinitions();
  }, []);

  const chat = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) {
        toast({ variant: 'error', description: 'Please enter a question.' });
        return;
      }

      const started = start(() => {
        toast({ variant: 'error', description: 'Wait for the current response to finish.' });
      });

      if (!started) {
        return;
      }

      isStreamingAssistantRef.current = false;
      accumulatedContentRef.current = '';
      accumulatedThinkingRef.current = '';

      const history = [
        ...messages,
        { role: 'user', content: userInput },
      ] as ChatMessageDto[];

      setMessages(history);

      try {
        const body: ChatRequestDto = {
          model,
          messages: history,
          options: { temperature },
          think,
          tools: toolDefinitions,
        };

        const response = await ollama.chatWithTools(body);

        await processSSEResponse<ChatResponseDto>(response, {
          onMessage: (data) => {
            const incoming = data.message;
            if (!incoming) {
              if (data.done) {
                stop();
              }
              return;
            }

            if (incoming.role === 'tool') {
              isStreamingAssistantRef.current = false;
              accumulatedContentRef.current = '';
              accumulatedThinkingRef.current = '';
              setToolMessages((prev) => [...prev, incoming]);
              setMessages((prev) => [...prev, incoming]);
              return;
            }

            if (incoming.tool_calls && incoming.tool_calls.length > 0) {
              const wasStreaming = isStreamingAssistantRef.current;
              const assistantWithToolCall: ChatMessageDto = {
                role: 'assistant',
                content: accumulatedContentRef.current || incoming.content || '',
                thinking: accumulatedThinkingRef.current || incoming.thinking || '',
                tool_calls: incoming.tool_calls,
              };
              isStreamingAssistantRef.current = false;
              accumulatedContentRef.current = '';
              accumulatedThinkingRef.current = '';
              setMessages((prev) => {
                if (wasStreaming) {
                  const updated = [...prev];
                  updated[updated.length - 1] = assistantWithToolCall;
                  return updated;
                }
                return [...prev, assistantWithToolCall];
              });
              return;
            }

            if (incoming.content || incoming.thinking) {
              if (incoming.content) {
                accumulatedContentRef.current += incoming.content;
              }
              if (incoming.thinking) {
                accumulatedThinkingRef.current += incoming.thinking;
              }

              const updatedAssistant: ChatMessageDto = {
                role: 'assistant',
                content: accumulatedContentRef.current,
                thinking: accumulatedThinkingRef.current,
              };

              const wasStreaming = isStreamingAssistantRef.current;
              isStreamingAssistantRef.current = true;

              setMessages((prev) => {
                if (wasStreaming) {
                  const updated = [...prev];
                  updated[updated.length - 1] = updatedAssistant;
                  return updated;
                }
                return [...prev, updatedAssistant];
              });
            }

            if (data.done) {
              stop();
            }
          },
          onError: (error) => {
            console.error('Tool chat SSE error', error);
            options?.onError?.(error);
            toast({ variant: 'error', description: 'Failed to process tool response' });
            stop();
          },
          onComplete: () => {
            stop();
          },
        });
      } catch (error) {
        console.error('Tool chat error', error);
        const message = error instanceof Error ? error.message : 'Failed to chat with tools';
        toast({ variant: 'error', description: message });
        options?.onError?.(error instanceof Error ? error : new Error(message));
        stop();
      }
    },
    [isChatting, messages, model, temperature, think, toast, toolDefinitions, options, start, stop]
  );

  return {
    messages,
    toolMessages,
    isChatting,
    isLoadingSystemPrompt,
    chat,
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink,
    setMessages,
    toolDefinitions,
  };
}
