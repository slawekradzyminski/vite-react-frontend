import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useShopWebMcp } from './useShopWebMcp';
import { cart, products } from '../../lib/api';
import type { ShopTool } from './webmcp-model';

vi.mock('../../lib/api', () => ({
  cart: { getCart: vi.fn(), addToCart: vi.fn() },
  products: { getAllProducts: vi.fn() },
}));

const saved = { username: 'client', items: [{ productId: 11, quantity: 2 }], totalPrice: 25, totalItems: 2 };
const catalogue = [{ id: 11, name: 'Cable', description: 'USB accessory', category: 'Hardware', stockQuantity: 5, price: 12.5, imageUrl: '' }];
let registered: ShopTool[];
let signals: AbortSignal[];
let registerTool: ReturnType<typeof vi.fn>;

function renderShop(enabled = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSearch = vi.fn();
  const hook = renderHook(() => useShopWebMcp(onSearch, enabled), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  return { ...hook, client, onSearch };
}

beforeEach(() => {
  vi.clearAllMocks();
  registered = []; signals = [];
  registerTool = vi.fn(async (tool: ShopTool, options: { signal: AbortSignal }) => { registered.push(tool); signals.push(options.signal); });
  Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool } });
  vi.mocked(products.getAllProducts).mockResolvedValue({ data: catalogue } as never);
  vi.mocked(cart.getCart).mockResolvedValue({ data: saved } as never);
  vi.mocked(cart.addToCart).mockResolvedValue({ data: saved } as never);
});
afterEach(() => { Reflect.deleteProperty(document, 'modelContext'); });

describe('Shared shop WebMCP integration', () => {
  it('registers tools and aborts their lifetime on unmount', async () => {
    const hook = renderShop();
    await waitFor(() => expect(hook.result.current.status).toBe('3 native WebMCP tools registered'));
    expect(registered.map(tool => tool.name)).toEqual(['search_products', 'add_to_cart', 'get_cart']);
    hook.unmount();
    expect(signals.every(signal => signal.aborted)).toBe(true);
  });

  it('preserves the normal UI when the browser has no native API', () => {
    Reflect.deleteProperty(document, 'modelContext');
    const hook = renderShop();
    expect(hook.result.current.status).toBe('WebMCP unavailable in this browser');
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('does not register in the explicit UI baseline', () => {
    const hook = renderShop(false);
    expect(hook.result.current.status).toBe('Tools disabled for the UI baseline');
    expect(registerTool).not.toHaveBeenCalled();
  });

  it('shares fresh catalogue data and filters with the existing UI', async () => {
    const hook = renderShop();
    await waitFor(() => expect(registered).toHaveLength(3));
    await act(async () => { await registered[0].execute({ query: 'USB', inStockOnly: true }); });
    expect(hook.client.getQueryData(['products'])).toEqual({ data: catalogue });
    expect(hook.onSearch).toHaveBeenCalledWith('USB', true);
    expect(hook.result.current.calls[0]).toMatchObject({ name: 'search_products', result: { content: [{ text: expect.stringContaining('Cable') }] } });
  });

  it('publishes saved cart data to the cache used by product cards', async () => {
    const hook = renderShop();
    await waitFor(() => expect(registered).toHaveLength(3));
    await act(async () => { await registered[1].execute({ productId: 11, quantity: 2 }); });
    expect(cart.addToCart).toHaveBeenCalledWith({ productId: 11, quantity: 2 });
    expect(hook.client.getQueryData(['cart'])).toMatchObject({ data: saved });
  });

  it('refreshes the cache when get_cart reads newer saved data', async () => {
    const hook = renderShop();
    hook.client.setQueryData(['cart'], { data: { ...saved, items: [], totalItems: 0, totalPrice: 0 } });
    await waitFor(() => expect(registered).toHaveLength(3));
    await act(async () => { await registered[2].execute({}); });
    expect(cart.getCart).toHaveBeenCalledOnce();
    expect(hook.client.getQueryData(['cart'])).toMatchObject({ data: saved });
  });

  it('cleans up partially registered tools after registration fails', async () => {
    registerTool.mockRejectedValueOnce(new Error('Browser rejected registration'));
    const hook = renderShop();
    await waitFor(() => expect(hook.result.current.status).toContain('Tool registration failed'));
    const options = registerTool.mock.calls[0][1] as { signal: AbortSignal };
    expect(options.signal.aborted).toBe(true);
  });
});
