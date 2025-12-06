import { useCallback, useEffect, useRef, useState } from 'react';
import { ollama, systemPrompt } from '../lib/api';
import { TOOL_DEFINITIONS } from '../lib/ollamaTools';
import type { ChatMessageDto, ChatRequestDto, ChatResponseDto, OllamaToolDefinition } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { useToast } from './useToast';

interface UseOllamaToolChatOptions {
  onError?: (error: Error) => void;
}

const DEFAULT_PROMPT = 'You are a shopping copilot. Call get_product_snapshot before answering catalog questions.';

export function useOllamaToolChat(options?: UseOllamaToolChatOptions) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageDto[]>([
    { role: 'system', content: DEFAULT_PROMPT },
  ]);
  const [toolMessages, setToolMessages] = useState<ChatMessageDto[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [model, setModel] = useState('qwen3:4b-instruct');
  const [temperature, setTemperature] = useState(0.4);
  const [think, setThink] = useState(false);
  const [isLoadingSystemPrompt, setIsLoadingSystemPrompt] = useState(true);
  const [toolDefinitions, setToolDefinitions] = useState<OllamaToolDefinition[]>(TOOL_DEFINITIONS);

  const isStreamingAssistantRef = useRef<boolean>(false);
  const accumulatedContentRef = useRef<string>('');
  const accumulatedThinkingRef = useRef<string>('');

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        setIsLoadingSystemPrompt(true);
        const response = await systemPrompt.get();
        const prompt = response.data.systemPrompt?.trim();
        if (prompt) {
          setMessages([{ role: 'system', content: prompt }]);
        }
      } catch (error) {
        console.error('Failed to fetch system prompt', error);
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
        if (Array.isArray(definitions) && definitions.length > 0) {
          setToolDefinitions(definitions);
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
      if (isChatting) {
        toast({ variant: 'error', description: 'Wait for the current response to finish.' });
        return;
      }

      setIsChatting(true);
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
                setIsChatting(false);
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
              setIsChatting(false);
            }
          },
          onError: (error) => {
            console.error('Tool chat SSE error', error);
            options?.onError?.(error);
            toast({ variant: 'error', description: 'Failed to process tool response' });
            setIsChatting(false);
          },
          onComplete: () => {
            setIsChatting(false);
          },
        });
      } catch (error) {
        console.error('Tool chat error', error);
        const message = error instanceof Error ? error.message : 'Failed to chat with tools';
        toast({ variant: 'error', description: message });
        options?.onError?.(error instanceof Error ? error : new Error(message));
        setIsChatting(false);
      }
    },
    [isChatting, messages, model, temperature, think, toast, toolDefinitions, options]
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
