import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { changeCommerceTransport, commerceTransport, type CommerceTransport } from '../../lib/commerceTransport';

export function CommerceTransportSelector() {
  const pendingMutations = useIsMutating();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  function change(transport: CommerceTransport) {
    try {
      // Recheck the cache at click time, even if React has not rendered the pending state yet.
      changeCommerceTransport(transport, queryClient.isMutating());
    } catch {
      setError('Cannot save the API selection in this browser.');
    }
  }

  return (
    <div className="text-xs text-slate-600">
      <label className="flex flex-col gap-1">
        <span>Shop API</span>
        <select
          aria-label="Shop API"
          data-testid="commerce-transport"
          className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm"
          value={commerceTransport}
          disabled={pendingMutations > 0}
          onChange={event => change(event.target.value as CommerceTransport)}
        >
          <option value="rest">REST</option>
          <option value="graphql">GraphQL</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
