import { useState } from 'react';
import { Link } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { loyalty } from '../../lib/api';
import { LOYALTY_TRANSACTIONS_QUERY_KEY } from '../../lib/tenderQueryKeys';
import { formatPoints } from '../../lib/payment';
import { StatusBadge } from '../commerce/shared';

const PAGE_SIZE = 10;

/** Paginated history of earned, redeemed, restored and revoked points. */
export function LoyaltyTransactions() {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: [...LOYALTY_TRANSACTIONS_QUERY_KEY, page],
    queryFn: () => loyalty.transactions(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
    retry: false,
  });

  if (query.isLoading) return <p className="text-sm text-slate-500" data-testid="loyalty-transactions-loading">Loading history…</p>;
  if (query.isError) return <p className="text-sm text-red-700" role="alert" data-testid="loyalty-transactions-error">Your points history could not be loaded.</p>;

  const transactions = query.data?.data?.content ?? [];
  const totalPages = query.data?.data?.totalPages ?? 0;
  if (transactions.length === 0) return <p className="text-sm text-slate-500" data-testid="loyalty-transactions-empty">No points activity yet. You earn points when an order is paid.</p>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm" data-testid="loyalty-transactions-table">
          <thead className="bg-stone-50/80 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2">Date</th>
              <th scope="col" className="px-4 py-2">Type</th>
              <th scope="col" className="px-4 py-2">Order</th>
              <th scope="col" className="px-4 py-2 text-right">Points</th>
              <th scope="col" className="px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {transactions.map((entry) => {
              const points = entry.points ?? 0;
              return (
                <tr key={entry.id} data-testid={`loyalty-transaction-${entry.id}`}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2"><StatusBadge status={entry.type} testId={`loyalty-transaction-type-${entry.id}`} /></td>
                  <td className="px-4 py-2">
                    {entry.orderId
                      ? <Link to={`/orders/${entry.orderId}`} className="text-slate-700 underline-offset-4 hover:underline" data-testid={`loyalty-transaction-order-${entry.id}`}>#{entry.orderId}</Link>
                      : '—'}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${points >= 0 ? 'text-emerald-700' : 'text-red-700'}`} data-testid={`loyalty-transaction-points-${entry.id}`}>
                    {points > 0 ? '+' : ''}{formatPoints(points)}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-700">{formatPoints(entry.balanceAfter ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3 text-sm" aria-label="Points history pages" data-testid="loyalty-transactions-pagination">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-white disabled:opacity-50"
            onClick={() => setPage((current) => current - 1)}
            disabled={page === 0}
            data-testid="loyalty-transactions-prev"
          >
            Previous
          </button>
          <span className="text-slate-600" data-testid="loyalty-transactions-page">Page {page + 1} of {totalPages}</span>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-white disabled:opacity-50"
            onClick={() => setPage((current) => current + 1)}
            disabled={page >= totalPages - 1}
            data-testid="loyalty-transactions-next"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
