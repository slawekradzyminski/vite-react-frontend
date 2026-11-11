import { useState } from 'react';
import { Button } from './button';

interface CopyButtonProps {
  value: string;
  label?: string;
  /** What is copied, for the screen-reader announcement, e.g. "Signing secret". */
  subject: string;
  'data-testid': string;
}

export function CopyButton({ value, label = 'Copy', subject, 'data-testid': testId }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`${label}: ${subject}`} data-testid={testId}>
        {state === 'copied' ? 'Copied' : label}
      </Button>
      <span role="status" className="sr-only" data-testid={`${testId}-status`}>
        {state === 'copied' ? `${subject} copied to the clipboard.` : state === 'failed' ? `Could not copy the ${subject.toLowerCase()}. Select it and copy it manually.` : ''}
      </span>
    </span>
  );
}
