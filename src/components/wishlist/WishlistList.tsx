import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlist } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { formatDateTime } from '../../lib/commerceFormat';
import { PageHeader } from '../commerce/shared';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Surface } from '../ui/surface';
import { WISHLIST_QUERY_KEY } from '../../lib/commerceQueryKeys';

export function WishlistList() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: WISHLIST_QUERY_KEY, queryFn: wishlist.list });
  const refresh = () => queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
  const toggleNotify = useMutation({
    mutationFn: ({ productId, notify }: { productId: number; notify: boolean }) => wishlist.upsert(productId, notify),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (productId: number) => wishlist.remove(productId), onSuccess: refresh });
  const items = data?.data ?? [];

  return (
    <div className="space-y-6 pb-10" data-testid="wishlist-page">
      <PageHeader eyebrow="Saved for later" title="Wishlist" description="Products you saved, with live price and availability. Turn on email to hear when a sold-out product returns." aside={<p className="text-sm text-slate-500" data-testid="wishlist-count">{items.length} of 50 products</p>} />
      <Surface variant="default" padding="none" className="overflow-hidden">
        {isLoading && <p className="p-8 text-center text-sm text-slate-500" data-testid="wishlist-loading">Loading wishlist…</p>}
        {isError && <p className="p-8 text-center text-sm text-red-700" role="alert" data-testid="wishlist-error">Unable to load your wishlist.</p>}
        {!isLoading && !isError && items.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500" data-testid="wishlist-empty">
            Your wishlist is empty. <Link to="/products" className="font-medium text-slate-900 underline" data-testid="wishlist-browse">Browse products</Link>
          </div>
        )}
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.productId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" data-testid={`wishlist-item-${item.productId}`}>
              <div className="min-w-0">
                <Link to={`/products/${item.productId}`} className="font-medium text-slate-950 hover:underline" data-testid={`wishlist-item-link-${item.productId}`}>{item.productName}</Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span data-testid={`wishlist-item-price-${item.productId}`}>{formatPrice(item.price ?? 0)}</span>
                  <Badge variant={item.stockStatus === 'OUT_OF_STOCK' ? 'error' : 'success'} data-testid={`wishlist-item-stock-${item.productId}`}>
                    {item.stockStatus === 'OUT_OF_STOCK' ? 'Out of stock' : `${item.stockQuantity} in stock`}
                  </Badge>
                  {item.lastNotifiedAt && <span className="text-xs text-slate-500" data-testid={`wishlist-item-notified-${item.productId}`}>Emailed {formatDateTime(item.lastNotifiedAt)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={Boolean(item.notifyWhenAvailable)} onChange={(event) => toggleNotify.mutate({ productId: item.productId as number, notify: event.target.checked })} data-testid={`wishlist-item-notify-${item.productId}`} />
                  Notify me
                </label>
                <Button variant="outline" size="sm" onClick={() => remove.mutate(item.productId as number)} disabled={remove.isPending} data-testid={`wishlist-item-remove-${item.productId}`}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
