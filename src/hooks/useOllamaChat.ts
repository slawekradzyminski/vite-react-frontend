import { useState, useCallback } from 'react';
import { useToast } from './useToast';
import { ChatMessageDto, ChatRequestDto, ChatResponseDto } from '../types/ollama';
import { processSSEResponse } from '../lib/sse';
import { ollama } from '../lib/api';

interface UseOllamaChatOptions {
  onError?: (error: Error) => void;
}

export function useOllamaChat(options?: UseOllamaChatOptions) {
  const { toast } = useToast();

  // Hold entire conversation, including system instructions
  const [messages, setMessages] = useState<ChatMessageDto[]>([
    {
      role: 'system',
      content: 'You are a helpful AI assistant. You must use the conversation history to answer questions.'
    }
  ]);

  // Model name
  const [model, setModel] = useState('llama3.2:1b');

  // Are we currently streaming from the backend?
  const [isChatting, setIsChatting] = useState(false);

  /**
   * The function that sends a user message, then streams the assistant response into
   * the conversation array in real time.
   */
  const chat = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) {
        toast({ variant: 'error', description: 'Please enter a message' });
        return;
      }

      // If you want to prevent overlapping calls, check isChatting
      if (isChatting) {
        toast({
          variant: 'error',
          description: 'Please wait for the current response to finish.'
        });
        return;
      }

      setIsChatting(true);

      /**
       * 1) Build new message array for local use
       *    (Old conversation + user’s new message).
       */
      const newMessages = [
        ...messages,
        { role: 'user', content: userMessage }
      ];

      /**
       * 2) Immediately update state so the UI shows the user’s message.
       *    If you do not do this first, the UI won't display the user message instantly.
       */
      setMessages(newMessages as ChatMessageDto[]);

      /**
       * 3) Also append a placeholder assistant message with empty content.
       *    We'll fill it in chunk by chunk from SSE. This ensures your conversation
       *    array always has a "current" assistant message to append to.
       *
       *    We'll store the index of that new assistant message so we can update it.
       */
      const assistantPlaceholder = {
        role: 'assistant',
        content: ''
      };
      const assistantIndex = newMessages.length; // position where assistant message goes

      const newMessagesWithAssistant = [...newMessages, assistantPlaceholder];
      setMessages(newMessagesWithAssistant as ChatMessageDto[]);

      /**
       * This final array includes:
       *  - All old messages
       *  - New user message
       *  - Assistant placeholder
       */
      const requestBody: ChatRequestDto = {
        model,
        messages: newMessages as ChatMessageDto[], 
        options: { temperature: 0.7 }
      };

      try {
        // 4) Send the request
        const response = await ollama.chat(requestBody);

        // 5) Process the SSE stream
        let accumulatedContent = '';
        await processSSEResponse<ChatResponseDto>(response, {
          onMessage: (data) => {
            if (data.message?.content) {
              // Append chunk to accumulatedContent
              accumulatedContent += data.message.content;

              // Update the assistant's content in real-time via functional setState
              setMessages((prev) => {
                // Make a copy of the current conversation
                const updated = [...prev];
                // updated[assistantIndex] is the placeholder assistant message
                const oldAssistantMsg = updated[assistantIndex];
                // Overwrite with new content
                updated[assistantIndex] = {
                  ...oldAssistantMsg,
                  content: accumulatedContent
                };
                return updated;
              });
            }

            if (data.done) {
              // SSE indicates final chunk
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
    [messages, model, isChatting, toast, options]
  );

  return {
    messages,
    isChatting,
    chat,
    model,
    setModel,
    // If needed externally
    setMessages
  };
}
