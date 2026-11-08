import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { wishlist } from '../../lib/api';
import { WISHLIST_QUERY_KEY } from '../../lib/commerceQueryKeys';
import { serverMessage } from '../../lib/requestErrors';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';

/** Saves a product to the wishlist and toggles the back-in-stock email. */
export function WishlistButton({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: WISHLIST_QUERY_KEY, queryFn: wishlist.list });
  const items = Array.isArray(data?.data) ? data.data : [];
  const entry = items.find((item) => item.productId === productId);
  const onError = (error: unknown) =>
    toast({ variant: 'error', title: 'Wishlist', description: serverMessage(error, 'Unable to update your wishlist.') });
  const save = useMutation({
    mutationFn: (notify: boolean) => wishlist.upsert(productId, notify),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY }),
    onError,
  });
  const remove = useMutation({
    mutationFn: () => wishlist.remove(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY }),
    onError,
  });
  const busy = save.isPending || remove.isPending;

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="wishlist-controls">
      <Button
        variant="outline"
        onClick={() => (entry ? remove.mutate() : save.mutate(false))}
        disabled={busy}
        aria-pressed={Boolean(entry)}
        data-testid="wishlist-toggle"
      >
        <Heart className={`mr-2 h-4 w-4 ${entry ? 'fill-red-500 text-red-500' : ''}`} aria-hidden="true" />
        {entry ? 'Saved to wishlist' : 'Save to wishlist'}
      </Button>
      {entry && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(entry.notifyWhenAvailable)}
            onChange={(event) => save.mutate(event.target.checked)}
            disabled={busy}
            data-testid="wishlist-notify"
          />
          Email me when it is back in stock
        </label>
      )}
    </div>
  );
}
