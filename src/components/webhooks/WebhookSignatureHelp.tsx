import { Surface } from '../ui/surface';
import { CopyButton } from '../ui/copy-button';
import { SIGNATURE_SNIPPET } from '../../lib/webhookFormat';

export function WebhookSignatureHelp() {
  return (
    <Surface as="section" variant="inset" padding="md" aria-labelledby="webhook-signature-help-heading" data-testid="webhook-signature-help">
      <h2 id="webhook-signature-help-heading" className="text-lg font-semibold text-slate-950">Verify the signature</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Every delivery carries <code className="font-mono text-slate-900">X-Webhook-Signature: t=…,v1=…</code>.
        {' '}<code className="font-mono text-slate-900">t</code> is the Unix time of the attempt and
        {' '}<code className="font-mono text-slate-900">v1</code> is the lowercase hex HMAC-SHA256 of
        {' '}<code className="font-mono text-slate-900">t + "." + body</code>, keyed with your secret.
        Compare in constant time and reject timestamps older than a few minutes to stop replays.
        The <code className="font-mono text-slate-900">id</code> in the body stays the same on redelivery, so use it to skip duplicates.
      </p>
      <div className="mt-3 flex justify-end">
        <CopyButton value={SIGNATURE_SNIPPET} label="Copy snippet" subject="Verification snippet" data-testid="webhook-signature-copy" />
      </div>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-stone-100" data-testid="webhook-signature-snippet"><code>{SIGNATURE_SNIPPET}</code></pre>
    </Surface>
  );
}
