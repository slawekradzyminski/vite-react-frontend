/** Request body for the Ollama streaming endpoint */
export interface GenerateRequestDto {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
    // add more if needed
  };
}

/** Shape of each chunk from the server's SSE or streaming response */
export interface GenerateResponseDto {
  model: string;
  response: string;
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
    done: boolean;
    context?: number[] | null;
    created_at: string;
    total_duration?: number | null;
  };
} 