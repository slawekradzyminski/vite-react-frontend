import { useState, useCallback, useEffect } from 'react';
import { useToast } from './useToast';
import { ChatMessageDto, ChatRequestDto, ChatResponseDto } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { ollama, prompts } from '../lib/api';

interface UseOllamaChatOptions {
  onError?: (error: Error) => void;
}

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. You must use the conversation history to answer questions.';

export function useOllamaChat(options?: UseOllamaChatOptions) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageDto[]>([
    {
      role: 'system',
      content: DEFAULT_SYSTEM_PROMPT
    }
  ]);
  const [model, setModel] = useState('qwen3:0.6b');
  const [temperature, setTemperature] = useState(0.8);
  const [think, setThink] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isLoadingSystemPrompt, setIsLoadingSystemPrompt] = useState(true);
  
  // Fetch user's system prompt
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        setIsLoadingSystemPrompt(true);
        const promptResponse = await prompts.chat.get();
        const userPrompt = promptResponse.data.chatSystemPrompt;
        
        if (userPrompt && userPrompt.trim()) {
          setMessages([
            {
              role: 'system',
              content: userPrompt
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch system prompt:', error);
      } finally {
        setIsLoadingSystemPrompt(false);
      }
    };
    
    fetchSystemPrompt();
  }, []);
  
  const chat = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) {
        toast({ variant: 'error', description: 'Please enter a message' });
        return;
      }

      if (isChatting) {
        toast({
          variant: 'error',
          description: 'Please wait for the current response to finish.'
        });
        return;
      }

      setIsChatting(true);

      const newMessages = [
        ...messages,
        { role: 'user', content: userMessage }
      ];

      setMessages(newMessages as ChatMessageDto[]);

      const assistantPlaceholder: ChatMessageDto = {
        role: 'assistant',
        content: '',
        thinking: ''
      };
      const assistantIndex = newMessages.length;

      const newMessagesWithAssistant = [...newMessages, assistantPlaceholder];
      setMessages(newMessagesWithAssistant as ChatMessageDto[]);

      const requestBody: ChatRequestDto = {
        model,
        messages: newMessages as ChatMessageDto[], 
        think,
        options: { temperature }
      };

      try {
        const response = await ollama.chat(requestBody);

        let accumulatedContent = '';
        let accumulatedThinking = '';
        await processSSEResponse<ChatResponseDto>(response, {
          onMessage: (data) => {
            if (data.message?.content) {
              accumulatedContent += data.message.content;
            }
            if (data.message?.thinking) {
              accumulatedThinking += data.message.thinking;
            }

            setMessages((prev) => {
              const updated = [...prev];
              const oldAssistantMsg = updated[assistantIndex];
              updated[assistantIndex] = {
                ...oldAssistantMsg,
                content: accumulatedContent,
                thinking: accumulatedThinking
              };
              return updated;
            });

            if (data.done) {
              setIsChatting(false);
            }
          },
          onError: (error) => {
            console.error('SSE processing error:', error);
            options?.onError?.(error);
            toast({ variant: 'error', description: 'Failed to process response' });
            setIsChatting(false);
          },
          onComplete: () => {
            setIsChatting(false);
          }
        });
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to chat';
        toast({ variant: 'error', description: errorMessage });
        options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
        setIsChatting(false);
      }
    },
    [messages, model, temperature, think, isChatting, toast, options]
  );

  return {
    messages,
    isChatting,
    isLoadingSystemPrompt,
    chat,
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink,
    setMessages
  };
}
