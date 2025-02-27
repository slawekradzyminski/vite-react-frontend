import { useState, useCallback, useEffect } from 'react';
import { useToast } from './useToast';
import { ChatMessageDto, ChatRequestDto, ChatResponseDto } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { auth, ollama, systemPrompt } from '../lib/api';

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
  const [model, setModel] = useState('llama3.2:1b');
  const [temperature, setTemperature] = useState(0.8);
  const [isChatting, setIsChatting] = useState(false);
  const [isLoadingSystemPrompt, setIsLoadingSystemPrompt] = useState(true);
  
  // Fetch user's system prompt
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        setIsLoadingSystemPrompt(true);
        const userResponse = await auth.me();
        const username = userResponse.data.username;
        
        if (username) {
          const promptResponse = await systemPrompt.get(username);
          const userPrompt = promptResponse.data.systemPrompt;
          
          if (userPrompt && userPrompt.trim()) {
            setMessages([
              {
                role: 'system',
                content: userPrompt
              }
            ]);
          }
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

      const assistantPlaceholder = {
        role: 'assistant',
        content: ''
      };
      const assistantIndex = newMessages.length;

      const newMessagesWithAssistant = [...newMessages, assistantPlaceholder];
      setMessages(newMessagesWithAssistant as ChatMessageDto[]);

      const requestBody: ChatRequestDto = {
        model,
        messages: newMessages as ChatMessageDto[], 
        options: { temperature }
      };

      try {
        const response = await ollama.chat(requestBody);

        let accumulatedContent = '';
        await processSSEResponse<ChatResponseDto>(response, {
          onMessage: (data) => {
            if (data.message?.content) {
              accumulatedContent += data.message.content;

              setMessages((prev) => {
                const updated = [...prev];
                const oldAssistantMsg = updated[assistantIndex];
                updated[assistantIndex] = {
                  ...oldAssistantMsg,
                  content: accumulatedContent
                };
                return updated;
              });
            }

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
    [messages, model, temperature, isChatting, toast, options]
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
    setMessages
  };
}
