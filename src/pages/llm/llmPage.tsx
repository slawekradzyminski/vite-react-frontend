import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles, Workflow } from 'lucide-react';
import { Surface } from '../../components/ui/surface';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const MODES = [
  {
    id: 'generate',
    title: 'Generate',
    badge: 'Single-shot',
    highlights: ['qwen3.5:2b', 'One-shot prompts', 'Markdown output'],
    icon: Sparkles,
    to: '/llm/generate',
    iconBg: 'bg-slate-900 text-stone-50',
    accentDot: 'bg-sky-500',
  },
  {
    id: 'chat',
    title: 'Chat',
    badge: 'Conversation',
    highlights: ['qwen3.5:2b', 'Custom system prompt', 'Thinking toggle'],
    icon: MessageSquare,
    to: '/llm/chat',
    iconBg: 'bg-slate-900 text-stone-50',
    accentDot: 'bg-amber-500',
  },
  {
    id: 'tools',
    title: 'Chat + Tools',
    badge: 'Conversation + Tools',
    highlights: ['qwen3.5:2b', 'Live tool output', 'Grounded responses'],
    icon: Workflow,
    to: '/llm/tools',
    iconBg: 'bg-slate-900 text-stone-50',
    accentDot: 'bg-emerald-500',
  },
];

export function LlmPage() {
  return (
    <div className="min-h-screen py-12" data-testid="llm-page">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Surface
          as="section"
          variant="heroAccent"
          padding="xl"
          className="md:px-10 md:py-10"
          data-testid="llm-hero"
        >
          <div className="space-y-5">
            <Badge variant="outline" tone="tracking" className="gap-2 px-4 text-[11px] tracking-[0.28em]">
              <Sparkles className="h-4 w-4" />
              LLM workspace
            </Badge>
            <h1 className="text-4xl font-bold text-slate-900" data-testid="llm-title">
              Orchestrate generate, chat, and tool flows in one cockpit
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600">
              Move between one-shot generation, conversational prompting, and catalog-grounded assistance without leaving the same operator shell.
            </p>
          </div>
        </Surface>

        <section className="mt-10" data-testid="llm-mode-grid">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  to={mode.to}
                  key={mode.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/88 p-6 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_-45px_rgba(15,23,42,0.55)]"
                  data-testid={`llm-mode-card-${mode.id}`}
                >
                  <div className="flex items-center gap-3 pt-2">
                    <Badge tone="tracking" className="text-[11px] tracking-[0.24em]">
                      {mode.badge}
                    </Badge>
                    <span className={`rounded-2xl ${mode.iconBg} p-2 shadow-[0_14px_26px_-20px_rgba(15,23,42,0.5)]`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{mode.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mode.highlights.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', mode.accentDot)} />
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 inline-flex items-center text-sm font-semibold text-slate-900">
                    Go to {mode.title}
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1 group-hover:text-sky-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
