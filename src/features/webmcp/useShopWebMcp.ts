import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cart, products } from '../../lib/api';
import type { Cart } from '../../types/cart';
import { createShopTools, getModelContext, registerShopTools } from './webmcp-model';
import type { ToolCall } from './webmcp-model';

export function useShopWebMcp(onSearch: (query: string, inStockOnly: boolean) => void, enabled = true) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('Checking browser support');
  const [calls, setCalls] = useState<ToolCall[]>([]);
  const onCall = useCallback((call: ToolCall) => setCalls(current => [call, ...current].slice(0, 20)), []);
  const tools = useMemo(() => createShopTools({
    getProducts: async () => {
      const response = await products.getAllProducts();
      queryClient.setQueryData(['products'], response);
      return response.data;
    },
    getCart: async () => (await cart.getCart()).data,
    addToCart: async (productId, quantity) => (await cart.addToCart({ productId, quantity })).data,
    onSearch,
    onCart: value => {
      queryClient.setQueryData(['cart'], (previous: { data: Cart } | undefined) => ({ ...previous, data: value }));
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  }, 'none', onCall), [onSearch, onCall, queryClient]);

  useEffect(() => {
    const context = getModelContext();
    if (!enabled) { setStatus('Tools disabled for the UI baseline'); return; }
    if (!context) { setStatus('WebMCP unavailable in this browser'); return; }
    const controller = new AbortController();
    setStatus('Registering tools');
    registerShopTools(context, tools, controller.signal).then(() => {
      if (!controller.signal.aborted) setStatus('3 native WebMCP tools registered');
    }).catch(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      setStatus('Tool registration failed. Reload this page to retry.');
    });
    return () => { controller.abort(); };
  }, [tools, enabled]);

  return { tools, calls, status };
}
