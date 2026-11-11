import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { CopyButton } from '../ui/copy-button';

interface WebhookSecretCalloutProps {
  secret: string;
  title: string;
  onDismiss: () => void;
  'data-testid': string;
}

// The backend returns a signing secret only from create and rotate-secret, so this is the
// one chance to copy it. Focus moves here so keyboard and screen-reader users notice it.
export function WebhookSecretCallout({ secret, title, onDismiss, 'data-testid': testId }: WebhookSecretCalloutProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [secret]);

  return (
    <section className="rounded-[1.5rem] border border-amber-300 bg-amber-50 p-5" aria-labelledby={`${testId}-heading`} data-testid={testId}>
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <h3 id={`${testId}-heading`} ref={headingRef} tabIndex={-1} className="font-semibold text-amber-900 focus:outline-none">{title}</h3>
          <p className="text-sm text-amber-900" data-testid={`${testId}-warning`}>
            Copy this secret now. It is shown only once; if you lose it, rotate the secret to get a new one.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 break-all rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-slate-900" data-testid={`${testId}-value`}>{secret}</code>
            <CopyButton value={secret} subject="Signing secret" data-testid={`${testId}-copy`} />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onDismiss} data-testid={`${testId}-dismiss`}>I have stored the secret</Button>
        </div>
      </div>
    </section>
  );
}
