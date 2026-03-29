import { ChevronRight } from 'lucide-react';

interface SystemPromptDetailsProps {
  content: string;
  testId: string;
}

export function SystemPromptDetails({ content, testId }: SystemPromptDetailsProps) {
  return (
    <details
      className="group rounded-[1.25rem] border border-stone-200 bg-stone-50/80 p-4"
      data-testid={testId}
    >
      <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600 [&::-webkit-details-marker]:hidden list-none">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        System prompt
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3 rounded-[1rem] border border-stone-200 bg-white px-4 py-3 text-xs whitespace-pre-line text-slate-600">
        {content}
      </div>
    </details>
  );
}
