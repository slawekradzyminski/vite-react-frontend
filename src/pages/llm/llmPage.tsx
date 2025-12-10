import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles, Workflow } from 'lucide-react';

const MODES = [
  {
    id: 'generate',
    title: 'Generate',
    badge: 'Single-shot',
    highlights: ['One-shot prompts', 'Markdown output', 'qwen3:0.6b'],
    icon: Sparkles,
    to: '/llm/generate',
    accent: 'from-purple-500/10 to-purple-500/0',
    glow: 'from-purple-500/15 via-purple-400/5 to-transparent',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'chat',
    title: 'Chat',
    badge: 'Conversation',
    highlights: ['Custom system prompt', 'Streams replies', 'Thinking toggle'],
    icon: MessageSquare,
    to: '/llm/chat',
    accent: 'from-blue-500/10 to-blue-500/0',
    glow: 'from-blue-500/15 via-blue-400/5 to-transparent',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'tools',
    title: 'Chat + Tools',
    badge: 'Conversation + Tools',
    highlights: ['qwen3:4b-instruct', 'Live tool output', 'Grounded responses'],
    icon: Workflow,
    to: '/llm/tools',
    accent: 'from-emerald-500/10 to-emerald-500/0',
    glow: 'from-emerald-500/15 via-emerald-400/5 to-transparent',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
];

export function LlmPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12" data-testid="llm-page">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-100 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-50 p-10 shadow-sm" data-testid="llm-hero">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              LLM workspace
            </p>
            <h1 className="text-4xl font-bold text-slate-900" data-testid="llm-title">
              Orchestrate generate, chat, and tool flows in one cockpit
            </h1>
          </div>
        </section>

        <section className="mt-10" data-testid="llm-mode-grid">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  to={mode.to}
                  key={mode.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  data-testid={`llm-mode-card-${mode.id}`}
                >
                  <div className={`pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-br ${mode.glow}`} aria-hidden />
                  <div className="flex items-center gap-3 pt-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {mode.badge}
                    </span>
                    <span className={`rounded-2xl ${mode.iconBg} p-2`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{mode.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mode.highlights.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-600">
                    Go to {mode.title}
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
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
