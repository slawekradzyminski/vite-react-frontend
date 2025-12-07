import ReactMarkdown from 'react-markdown';
import { ChatMessageDto } from '../../types/ollama';
import styles from './OllamaChat.module.css';

interface ChatTranscriptProps {
  messages: ChatMessageDto[];
}

const formatToolMessage = (message: ChatMessageDto) => {
  let formattedContent = message.content ?? '';
  let parsed: unknown = null;

  try {
    parsed = JSON.parse(message.content ?? '');
    formattedContent = JSON.stringify(parsed, null, 2);
  } catch {
    formattedContent = message.content ?? '';
  }

  const isError =
    typeof parsed === 'object' && parsed !== null && Object.prototype.hasOwnProperty.call(parsed, 'error');

  return (
    <div className="flex flex-col items-start w-full mb-4" data-testid="tool-message">
      <div
        className={`rounded-lg border px-4 py-3 w-full ${
          isError ? 'border-red-400 bg-red-50' : 'border-emerald-400 bg-emerald-50'
        }`}
      >
        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={isError ? 'text-red-500' : 'text-emerald-600'}
          >
            <path d="M1 21H23L12 2L1 21Z" />
            <path d="M11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="#fff" />
          </svg>
          Function output · {message.tool_name ?? 'tool'}
        </div>
        <pre className="bg-white rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap" data-testid="tool-message-content">
          {formattedContent}
        </pre>
      </div>
    </div>
  );
};

const renderAssistantMessage = (message: ChatMessageDto) => {
  const role = message.role ?? 'assistant';
  const isSystem = role === 'system';
  const isUser = role === 'user';
  const bgColor = isSystem ? 'bg-gray-100' : isUser ? 'bg-blue-50' : 'bg-green-50';
  const alignment = isUser ? 'items-end' : 'items-start';
  const roleLabel = typeof role === 'string'
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : 'Message';

  return (
    <div className={`flex flex-col ${alignment} w-full mb-4`} data-testid={`chat-message-${role}`}>
      <div className={`${bgColor} rounded-lg px-4 py-2 max-w-[80%]`}>
        <div className="text-sm text-gray-500 mb-1" data-testid={`chat-message-role-${role}`}>
          {roleLabel}
        </div>
        {message.thinking && (
          <details className="mb-3 text-xs text-gray-500" data-testid="thinking-toggle">
            <summary className="cursor-pointer select-none flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
              </svg>
              Thinking
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700" data-testid="thinking-content">
              <ReactMarkdown>{message.thinking}</ReactMarkdown>
            </div>
          </details>
        )}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mb-3 rounded border border-dashed border-blue-300 bg-blue-50/80 p-3 text-xs text-blue-900" data-testid="tool-call-notice">
            <div className="font-semibold mb-2">Requesting backend function</div>
            <ul className="space-y-1">
              {message.tool_calls.map((toolCall, index) => (
                <li key={`${toolCall.function.name}-${index}`}>
                  <span className="font-mono">{toolCall.function.name}</span>{' '}
                  <code className="bg-white/70 px-1 rounded">
                    {JSON.stringify(toolCall.function.arguments ?? {})}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={styles.markdownContainer} data-testid={`chat-message-content-${role}`}>
          <ReactMarkdown>{message.content ?? ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export function ChatTranscript({ messages }: ChatTranscriptProps) {
  const filteredMessages = messages.filter((msg) => {
    if (msg.role === 'assistant') {
      const hasContent = msg.content && msg.content.trim().length > 0;
      const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
      const hasThinking = msg.thinking && msg.thinking.trim().length > 0;
      return hasContent || hasToolCalls || hasThinking;
    }
    return true;
  });

  return (
    <div className={styles.conversationContainer} data-testid="chat-conversation">
      {filteredMessages.map((msg, idx) => (
        <div key={`${idx}-${msg.role ?? 'assistant'}`} data-testid={`chat-message-container-${idx}`}>
          {msg.role === 'tool' ? formatToolMessage(msg) : renderAssistantMessage(msg)}
        </div>
      ))}
    </div>
  );
}
