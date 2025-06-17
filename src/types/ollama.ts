/** Request body for the Ollama streaming endpoint */
export interface GenerateRequestDto {
  model: string;
  prompt: string;
  think?: boolean;
  options?: {
    temperature?: number;
    // add more if needed
  };
}

/** Shape of each chunk from the server's SSE or streaming response */
export interface GenerateResponseDto {
  model: string;
  response: string;
  thinking?: string;
  done: boolean;
  context: number[] | null;
  created_at: string;
  total_duration: number | null;
}

/** Raw SSE event, each `data:` line contains JSON */
export interface OllamaChunkEvent {
  data: {
    model: string;
    response: string;
    thinking?: string;
    done: boolean;
    context?: number[] | null;
    created_at: string;
    total_duration?: number | null;
  };
}

/** Chat message format for the chat endpoint */
export interface ChatMessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
  thinking?: string;
}

/** Request body for the chat endpoint */
export interface ChatRequestDto {
  model: string;
  messages: ChatMessageDto[];
  think?: boolean;
  options?: {
    temperature?: number;
    // add more if needed
  };
}

/** Response from the chat endpoint */
export interface ChatResponseDto {
  model: string;
  message: ChatMessageDto;
  done: boolean;
  created_at: string;
} 