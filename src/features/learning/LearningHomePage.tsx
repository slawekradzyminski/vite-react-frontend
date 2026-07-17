import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Cpu, Hand, ScanLine, Sigma, TextCursorInput } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { LEARNING_LABS, type LearningLabId } from './learningCatalog';

const icons: Record<LearningLabId, typeof Sigma> = {
  perceptron: Sigma,
  'next-token': TextCursorInput,
  convolution: ScanLine,
  digits: Hand,
  'kv-cache': Cpu,
};

export function LearningHomePage() {
  return (
    <div className="space-y-8" data-testid="learning-home-page">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_-60px_rgba(15,23,42,0.95)] md:px-10 md:py-10" data-testid="learning-hero">
        <div className="absolute inset-y-0 right-0 hidden w-[44%] md:block" aria-hidden="true">
          <div className="absolute right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-sky-300/20" />
          <div className="absolute right-24 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-sky-300/25" />
          <div className="absolute right-32 top-1/2 grid h-24 w-24 -translate-y-1/2 grid-cols-2 gap-2 rotate-12">
            {[0.82, 0.24, 0.48, 0.94].map((opacity, index) => (
              <span key={index} className="rounded-2xl bg-sky-400" style={{ opacity }} />
            ))}
          </div>
          <div className="absolute right-5 top-1/2 h-px w-56 -translate-y-1/2 bg-gradient-to-r from-sky-300/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <Badge variant="outline" tone="tracking" className="border-white/15 bg-white/5 text-sky-100">
            <BrainCircuit className="mr-2 h-4 w-4" />
            Interactive foundations
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl" data-testid="learning-home-title">
            Open the black box, one calculation at a time.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Five short labs connect learning rules, live token choices, visual filters, a trained classifier, and inference memory.
          </p>
          <Link
            to={LEARNING_LABS[0].route}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-400"
            data-testid="learning-start-button"
          >
            Start with the perceptron
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="learning-path-heading" data-testid="learning-path">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recommended sequence</p>
            <h2 id="learning-path-heading" className="mt-2 text-2xl font-semibold text-slate-950">Follow the signal</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600">Each lab stands alone, but the sequence moves from one neuron to a production inference constraint.</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/82">
          {LEARNING_LABS.map((lab, index) => {
            const Icon = icons[lab.id];
            return (
              <Link
                key={lab.id}
                to={lab.route}
                className="group grid gap-4 border-b border-stone-200/80 px-5 py-6 transition last:border-b-0 hover:bg-stone-50/85 md:grid-cols-[4rem_minmax(0,0.85fr)_minmax(0,1.15fr)_auto] md:items-center md:px-7"
                data-testid={`learning-path-${lab.id}`}
              >
                <div className="flex items-center gap-3 md:block">
                  <span className="text-xs font-semibold tabular-nums text-slate-400">0{index + 1}</span>
                  <span className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-sky-600 md:ml-0 md:mt-3">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-sky-700">{lab.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{lab.title}</h3>
                </div>
                <div>
                  <p className="text-sm leading-6 text-slate-600">{lab.description}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{lab.takeaway}</p>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-700 md:block" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
