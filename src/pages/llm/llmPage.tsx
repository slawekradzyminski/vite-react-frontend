import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles, Workflow } from 'lucide-react';

const MODES = [
  {
    id: 'chat',
    title: 'Chat',
    badge: 'Conversational',
    description: 'Use the chat lane when you need a collaborative assistant that can reference the conversation history and optionally expose its thinking traces.',
    highlights: [
      'Grounded by your custom system prompt',
      'Streaming responses with optional thinking output',
      'Best for debugging, planning, and Q&A loops',
    ],
    icon: MessageSquare,
    to: '/llm/chat',
    accent: 'from-blue-500/10 to-blue-500/0',
  },
  {
    id: 'generate',
    title: 'Generate',
    badge: 'Single-shot',
    description: 'Fire-and-forget completions for structured prompts, release notes, or summaries. The UI keeps temperature and thinking separate from chat history.',
    highlights: [
      'One prompt, one response workflow',
      'Great for docs, snippets, QA answers',
      'Still uses qwen3:0.6b so thinking is available',
    ],
    icon: Sparkles,
    to: '/llm/generate',
    accent: 'from-purple-500/10 to-purple-500/0',
  },
  {
    id: 'tools',
    title: 'Tools',
    badge: 'Catalog + APIs',
    description: 'Hands the model a contract for list_products and get_product_snapshot so every product mention is backed by live data from the training store.',
    highlights: [
      'qwen3:4b-instruct with tool-calling enabled',
      'Live tool call + tool output streaming',
      'Thinking disabled, results grounded in tool data',
    ],
    icon: Workflow,
    to: '/llm/tools',
    accent: 'from-emerald-500/10 to-emerald-500/0',
  },
];

export function LlmPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12" data-testid="llm-page">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section
          className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
          data-testid="llm-hero"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            LLM workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl" data-testid="llm-title">
            Choose the right mode for every assistant workflow
          </h1>
        </section>

        <section className="mt-10" data-testid="llm-mode-grid">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  to={mode.to}
                  key={mode.id}
                  className="group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  data-testid={`llm-mode-card-${mode.id}`}
                >
                  <div
                    className={`absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r ${mode.accent}`}
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {mode.badge}
                    </span>
                    <Icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{mode.title}</h3>
                  <p className="mt-3 flex-1 text-sm text-slate-600">{mode.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {mode.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
