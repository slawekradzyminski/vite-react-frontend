import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { returns } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { formatDateTime } from '../../lib/commerceFormat';
import { PageHeader, StatusBadge } from '../commerce/shared';
import { Surface } from '../ui/surface';

export function MyReturns() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['my-returns'], queryFn: () => returns.mine() });
  const items = data?.data.content ?? [];
  return (
    <div className="space-y-6 pb-10" data-testid="my-returns-page">
      <PageHeader eyebrow="After sales" title="My returns" description="Track return requests. Open a new return from a delivered order within 30 days of delivery." />
      <Surface variant="default" padding="none" className="overflow-hidden">
        {isLoading && <p className="p-8 text-center text-sm text-slate-500" data-testid="my-returns-loading">Loading returns…</p>}
        {isError && <p className="p-8 text-center text-sm text-red-700" role="alert" data-testid="my-returns-error">Unable to load your returns.</p>}
        {!isLoading && !isError && items.length === 0 && <p className="p-8 text-center text-sm text-slate-500" data-testid="my-returns-empty">You have no returns.</p>}
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.id} className="p-5" data-testid={`my-return-${item.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-950">Return #{item.id}</span>
                  <StatusBadge status={item.status} testId={`my-return-status-${item.id}`} />
                </div>
                <Link to={`/orders/${item.orderId}`} className="text-sm text-sky-700 hover:underline" data-testid={`my-return-order-${item.id}`}>Order #{item.orderId}</Link>
              </div>
              <p className="mt-2 text-sm text-slate-600">{(item.items ?? []).map((line) => `${line.quantity} × ${line.productName}`).join(', ')}</p>
              <p className="mt-1 text-sm text-slate-600" data-testid={`my-return-refund-${item.id}`}>
                {item.refundAmount != null ? `Refunded ${formatPrice(item.refundAmount)}` : `Estimated refund ${formatPrice(item.estimatedRefund ?? 0)}`}
              </p>
              {item.resolutionNote && <p className="mt-1 text-sm text-red-700" data-testid={`my-return-note-${item.id}`}>{item.resolutionNote}</p>}
              <p className="mt-1 text-xs text-slate-500">Requested {formatDateTime(item.createdAt)}</p>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
