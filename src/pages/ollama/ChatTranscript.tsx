import ReactMarkdown from 'react-markdown';
import { Brain, Code2, ShieldCheck, TerminalSquare, UserRound, Bot } from 'lucide-react';
import { ChatMessageDto } from '../../types/ollama';
import styles from './OllamaChat.module.css';

interface ChatTranscriptProps {
  messages: ChatMessageDto[];
  hideSystemMessage?: boolean;
  showWhenEmpty?: boolean;
}

type RoleKey = 'system' | 'user' | 'assistant';

const ROLE_CONFIG: Record<
  RoleKey,
  {
    label: string;
    pillLabel: string;
    icon: typeof ShieldCheck;
    badgeClass: string;
    bubbleClass: string;
    alignment: 'start' | 'end';
  }
> = {
  system: {
    label: 'System',
    pillLabel: 'System prompt',
    icon: ShieldCheck,
    badgeClass: 'border border-stone-200 bg-stone-50 text-slate-700',
    bubbleClass: 'border border-stone-200 bg-stone-50/80 text-slate-700 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.4)]',
    alignment: 'start',
  },
  user: {
    label: 'User',
    pillLabel: 'User',
    icon: UserRound,
    badgeClass: 'bg-slate-900 text-stone-50',
    bubbleClass: 'bg-slate-900 text-stone-50 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)]',
    alignment: 'end',
  },
  assistant: {
    label: 'Assistant',
    pillLabel: 'Assistant',
    icon: Bot,
    badgeClass: 'border border-stone-200 bg-white text-slate-800',
    bubbleClass: 'border border-stone-200 bg-white text-slate-900 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.4)]',
    alignment: 'start',
  },
};

const parseToolPayload = (message: ChatMessageDto) => {
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

  return { formattedContent, isError };
};

const ToolMessage = ({ message }: { message: ChatMessageDto }) => {
  const { formattedContent, isError } = parseToolPayload(message);

  return (
    <div className="mb-4">
      <div
        className={`rounded-[1.25rem] border px-4 py-3 shadow-inner ${
          isError ? 'border-red-300 bg-red-50/80' : 'border-stone-200 bg-stone-50/80'
        }`}
        data-testid="tool-message"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <TerminalSquare className={`h-4 w-4 ${isError ? 'text-red-600' : 'text-sky-600'}`} />
          Function output · {message.tool_name ?? 'tool'}
        </div>
        <pre
          className="overflow-x-auto whitespace-pre-wrap rounded-[1rem] border border-stone-200 bg-white p-3 text-xs text-slate-800"
          data-testid="tool-message-content"
        >
          {formattedContent}
        </pre>
      </div>
    </div>
  );
};

const ToolCallNotice = ({ message }: { message: ChatMessageDto }) => {
  if (!message.tool_calls || message.tool_calls.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50/80 p-3 text-xs text-slate-700"
      data-testid="tool-call-notice"
    >
      <div className="flex items-center gap-2 font-semibold">
        <Code2 className="h-4 w-4" />
        Function call requested
      </div>
      <ul className="mt-2 space-y-1">
        {message.tool_calls.map((toolCall, index) => (
          <li key={`${toolCall.function.name}-${index}`} className="flex flex-wrap gap-1">
            <span className="font-semibold">{toolCall.function.name}</span>
            <code className="rounded bg-white/90 px-1">{JSON.stringify(toolCall.function.arguments ?? {})}</code>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ThinkingBlock = ({ thinking }: { thinking?: string }) => {
  if (!thinking || !thinking.trim()) {
    return null;
  }

  return (
    <details className="group rounded-[1rem] border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-900" data-testid="thinking-toggle">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
        <Brain className="h-4 w-4 text-amber-600" />
        Thinking trace
      </summary>
      <div className="mt-2 rounded-[0.95rem] bg-white/90 p-3 text-amber-900" data-testid="thinking-content">
        <ReactMarkdown>{thinking}</ReactMarkdown>
      </div>
    </details>
  );
};

const renderChatMessage = (message: ChatMessageDto) => {
  const normalizedRole = (message.role as RoleKey) || 'assistant';
  const roleKey: RoleKey = ['system', 'user'].includes(normalizedRole) ? normalizedRole : 'assistant';
  const roleConfig = ROLE_CONFIG[roleKey];
  const Icon = roleConfig.icon;
  const alignmentClass = roleConfig.alignment === 'end' ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex ${alignmentClass} w-full mb-4`} data-testid={`chat-message-${roleKey}`}>
      <div className={`space-y-2 w-full ${roleConfig.alignment === 'end' ? 'md:w-2/3' : 'md:w-4/5'}`}>
        <div
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleConfig.badgeClass}`}
          data-testid={`chat-role-pill-${roleKey}`}
          aria-label={roleConfig.pillLabel}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div data-testid={`chat-message-role-${roleKey}`} className="text-xs uppercase tracking-widest text-slate-500">
          {roleConfig.label}
        </div>
        <div className={`${roleConfig.bubbleClass} rounded-[1.25rem] px-4 py-3 space-y-3`}>
          {message.thinking && <ThinkingBlock thinking={message.thinking} />}
          {message.content && (
            <div className={styles.markdownContainer} data-testid={`chat-message-content-${roleKey}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          <ToolCallNotice message={message} />
        </div>
      </div>
    </div>
  );
};

export function ChatTranscript({ messages, hideSystemMessage = false, showWhenEmpty = false }: ChatTranscriptProps) {
  const filteredMessages = messages.filter((msg) => {
    if (hideSystemMessage && msg.role === 'system') {
      return false;
    }
    if (msg.role === 'assistant') {
      const hasContent = msg.content && msg.content.trim().length > 0;
      const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
      const hasThinking = msg.thinking && msg.thinking.trim().length > 0;
      return hasContent || hasToolCalls || hasThinking;
    }
    return true;
  });

  if (!showWhenEmpty && filteredMessages.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.conversationContainer}
      data-testid="chat-conversation"
    >
      {filteredMessages.map((msg, idx) => (
        <div key={`${idx}-${msg.role ?? 'assistant'}`} data-testid={`chat-message-container-${idx}`}>
          {msg.role === 'tool' ? <ToolMessage message={msg} /> : renderChatMessage(msg)}
        </div>
      ))}
    </div>
  );
}
