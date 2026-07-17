import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { LEARNING_LABS, getLearningLab } from './learningCatalog';
import { cn } from '../../lib/utils';

export function LearningLayout() {
  const location = useLocation();
  const currentLab = getLearningLab(location.pathname);

  return (
    <div className="pb-10" data-testid="learning-layout">
      <div className="mb-5 flex flex-col gap-4 border-b border-stone-200/80 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/learn"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-600 transition hover:-translate-x-0.5 hover:border-stone-300 hover:text-slate-950"
            aria-label="Back to AI Lab overview"
            data-testid="learning-home-link"
          >
            {currentLab ? <ArrowLeft className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
          </Link>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-sky-700">AI Learning Lab</p>
            <p className="truncate text-sm text-slate-600">
              {currentLab ? `${currentLab.order} of ${LEARNING_LABS.length} · ${currentLab.shortTitle}` : 'Five interactive explanations'}
            </p>
          </div>
        </div>

        <nav className="-mx-1 overflow-x-auto px-1 pb-1" aria-label="AI Learning Lab" data-testid="learning-subnav">
          <div className="flex min-w-max items-center gap-1 rounded-full border border-stone-200 bg-white/80 p-1">
            {LEARNING_LABS.map((lab) => {
              const active = location.pathname === lab.route;
              return (
                <Link
                  key={lab.id}
                  to={lab.route}
                  className={cn(
                    'rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm',
                    active
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-stone-100 hover:text-slate-950',
                  )}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`learning-nav-${lab.id}`}
                >
                  {lab.shortTitle}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
