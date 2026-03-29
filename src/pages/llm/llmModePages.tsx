import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { OllamaChatPage } from '../ollama/chatPage';
import { OllamaGeneratePage } from '../ollama/generatePage';
import { OllamaToolChatPage } from '../ollama/toolChatPage';
import type { ReactNode } from 'react';
import { Surface } from '../../components/ui/surface';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface LlmModeLayoutProps {
  badge: string;
  title: string;
  children: ReactNode;
  testId: string;
}

function LlmModeLayout({ badge, title, children, testId }: LlmModeLayoutProps) {
  return (
    <div className="min-h-screen py-12" data-testid={testId}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Surface as="section" variant="hero" padding="lg" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="tracking" className="text-[11px] tracking-[0.24em]">
                {badge}
              </Badge>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>
            </div>
            <Button asChild variant="outline" className="rounded-full px-4" data-testid="llm-back-link">
              <Link to="/llm">
                <ArrowLeft className="h-4 w-4" />
                Back to overview
              </Link>
            </Button>
          </div>
          <Surface variant="muted" padding="sm" data-testid="llm-mode-workspace">
            {children}
          </Surface>
        </Surface>
      </div>
    </div>
  );
}

export function LlmChatExperience() {
  return (
    <LlmModeLayout
      badge="Chat"
      title="Conversational assistant"
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
      testId="llm-tools-mode"
    >
      <OllamaToolChatPage hideTitle />
    </LlmModeLayout>
  );
}
