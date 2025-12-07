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
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCallFunctionDto {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface ToolCallDto {
  id?: string;
  function: ToolCallFunctionDto;
}

export interface ChatMessageDto {
  role: ChatRole;
  content: string;
  thinking?: string;
  tool_calls?: ToolCallDto[];
  tool_name?: string;
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
  tools?: OllamaToolDefinition[];
}

/** Response from the chat endpoint */
export interface ChatResponseDto {
  model: string;
  message: ChatMessageDto;
  done: boolean;
  created_at: string;
}

export interface OllamaToolSchemaProperty {
  type: 'string' | 'integer' | 'number' | 'boolean' | 'object';
  description?: string;
  enum?: string[];
}

export interface OllamaToolParameters {
  type: 'object';
  properties: Record<string, OllamaToolSchemaProperty>;
  oneOf?: Array<{ required: string[] }>;
  required?: string[];
}

export interface OllamaToolFunction {
  name: string;
  description: string;
  parameters: OllamaToolParameters;
}

export interface OllamaToolDefinition {
  type: 'function';
  function: OllamaToolFunction;
}
