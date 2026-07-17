import type { ReactNode } from 'react';
import { Badge } from '../../components/ui/badge';

type LabPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
};

export function LabPageHeader({ eyebrow, title, description, aside }: LabPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
      </div>
      {aside ? <Badge variant="outline" className="w-fit shrink-0 px-4 py-2">{aside}</Badge> : null}
    </header>
  );
}
