import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { OllamaChatPage } from '../ollama/chatPage';
import { OllamaGeneratePage } from '../ollama/generatePage';
import { OllamaToolChatPage } from '../ollama/toolChatPage';
import type { ReactNode } from 'react';

interface LlmModeLayoutProps {
  badge: string;
  title: string;
  description: string;
  supportingPoints: string[];
  children: ReactNode;
  testId: string;
}

function LlmModeLayout({
  badge,
  title,
  description,
  supportingPoints,
  children,
  testId,
}: LlmModeLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-12" data-testid={testId}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {badge}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>
              <p className="mt-3 text-slate-600">{description}</p>
            </div>
            <Link
              to="/llm"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              data-testid="llm-back-link"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to overview
            </Link>
          </div>
          <ul className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-3">
            {supportingPoints.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-inner" data-testid="llm-mode-workspace">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LlmChatExperience() {
  return (
    <LlmModeLayout
      badge="Chat"
      title="Conversational assistant"
      description="Use this space to iterate with qwen3:0.6b, stream replies, and optionally inspect the model’s thinking traces."
      supportingPoints={[
        'Customizable system prompt per user',
        'Conversation history preserved across turns',
        'Thinking toggle for transparency during debugging',
      ]}
      testId="llm-chat-mode"
    >
      <OllamaChatPage hideTitle />
    </LlmModeLayout>
  );
}

export function LlmGenerateExperience() {
  return (
    <LlmModeLayout
      badge="Generate"
      title="Single prompt generation"
      description="Perfect for summaries, release notes, or QA answers. Adjust temperature, prompt once, and ship the markdown."
      supportingPoints={[
        'One-shot completions with deterministic mock data',
        'Thinking panel mirrors the chat experience',
        'Ideal for documentation drafts and snippets',
      ]}
      testId="llm-generate-mode"
    >
      <OllamaGeneratePage hideTitle />
    </LlmModeLayout>
  );
}

export function LlmToolExperience() {
  return (
    <LlmModeLayout
      badge="Tools"
      title="Catalog-grounded assistant"
      description="Grants the model catalog functions so every response cites list_products snapshots before replying."
      supportingPoints={[
        'Pinned to qwen3:4b-instruct with tool-calling',
        'Thinking disabled to match backend contract',
        'Live JSON viewer for tool definitions and results',
      ]}
      testId="llm-tools-mode"
    >
      <OllamaToolChatPage hideTitle />
    </LlmModeLayout>
  );
}
