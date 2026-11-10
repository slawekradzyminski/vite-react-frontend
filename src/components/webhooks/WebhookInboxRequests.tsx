import { useInboxRequests, INBOX_REFRESH_MS } from '../../hooks/useWebhooks';
import { formatDateTime } from '../../lib/commerceFormat';
import { headerValue, parseSignatureHeader, prettyJson, SIGNATURE_HEADER } from '../../lib/webhookFormat';

export function WebhookInboxRequests({ token }: { token: string }) {
  const requests = useInboxRequests(token, true);
  const prefix = `webhook-inbox-requests-${token}`;
  const items = requests.data ?? [];

  return (
    <div className="space-y-3" data-testid={prefix}>
      <p className="text-xs text-slate-500">Refreshes every {INBOX_REFRESH_MS / 1000} seconds. The newest 50 requests are kept.</p>
      {requests.isLoading && <p className="text-sm text-slate-500" data-testid={`${prefix}-loading`}>Loading requests…</p>}
      {requests.isError && <p className="text-sm text-red-700" role="alert" data-testid={`${prefix}-error`}>Unable to load the received requests.</p>}
      {!requests.isLoading && !requests.isError && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid={`${prefix}-empty`}>Nothing received yet.</p>
      )}
      <ul className="space-y-3" aria-live="polite">
        {items.map((request) => {
          const signature = parseSignatureHeader(headerValue(request.headers, SIGNATURE_HEADER));
          const event = headerValue(request.headers, 'X-Webhook-Event');
          return (
            <li key={request.id} className="rounded-xl border border-stone-200 bg-white p-3" data-testid={`webhook-inbox-request-${request.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-mono font-medium text-slate-900" data-testid={`webhook-inbox-request-event-${request.id}`}>{event ?? 'unknown event'}</span>
                <span className="text-xs text-slate-500">{formatDateTime(request.receivedAt)}</span>
              </div>
              {signature && (
                <p className="mt-1 break-all font-mono text-xs text-slate-600" data-testid={`webhook-inbox-request-signature-${request.id}`}>
                  t={signature.timestamp} v1={signature.signatures[0]}
                </p>
              )}
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-stone-100" data-testid={`webhook-inbox-request-body-${request.id}`}>{prettyJson(request.body)}</pre>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium text-slate-700">Headers</summary>
                <table className="mt-1 w-full text-left text-xs" data-testid={`webhook-inbox-request-headers-${request.id}`}>
                  <tbody>
                    {Object.entries(request.headers ?? {}).map(([name, value]) => (
                      <tr key={name} className="border-b border-stone-100">
                        <th scope="row" className="py-1 pr-3 font-mono font-medium text-slate-600">{name}</th>
                        <td className="break-all py-1 font-mono text-slate-900">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
