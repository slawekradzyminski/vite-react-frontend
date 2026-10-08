import { describe, expect, it, vi } from 'vitest';
import { createShopTools, filterProducts, readFault, registerShopTools } from './webmcp-model';
import type { ShopServices, ShopTool, ToolResult } from './webmcp-model';
import type { Product } from '../../types/product';

const cheap: Product = { id: 11, name: 'Lab cable', category: 'Lab', description: 'Cable', price: 12.5, stockQuantity: 5, imageUrl: '' };
const expensive: Product = { ...cheap, id: 12, name: 'Lab charger', price: 25 };
const unavailable: Product = { ...cheap, id: 13, name: 'Lab adapter', price: 1, stockQuantity: 0 };
const empty = { username: 'client', items: [], totalPrice: 0, totalItems: 0 };
const filled = { ...empty, items: [{ productId: 11, quantity: 2, productName: 'Lab cable', unitPrice: 12.5, totalPrice: 25 }], totalPrice: 25, totalItems: 2 };
const decode = (result: ToolResult) => JSON.parse(result.content[0].text);
const services = (): ShopServices => ({
  getProducts: vi.fn().mockResolvedValue([expensive, unavailable, cheap]),
  getCart: vi.fn().mockResolvedValue(filled),
  addToCart: vi.fn().mockResolvedValue(filled),
  onSearch: vi.fn(), onCart: vi.fn(),
});

describe('Shop tool contracts', () => {
  it('searches case-insensitively, filters stock and sorts by price', async () => {
    const app = services();
    const search = createShopTools(app)[0];

    const result = await search.execute({ query: 'LAB', inStockOnly: true });

    expect(decode(result).map((value: Product) => value.id)).toEqual([11, 12]);
    expect(app.onSearch).toHaveBeenCalledWith('LAB', true);
    expect(app.addToCart).not.toHaveBeenCalled();
  });

  it('adds the requested product and additional quantity and updates the display', async () => {
    const app = services();

    const result = await createShopTools(app)[1].execute({ productId: 11, quantity: 2 });

    expect(decode(result)).toEqual(filled);
    expect(app.addToCart).toHaveBeenCalledWith(11, 2);
    expect(app.onCart).toHaveBeenCalledWith(filled);
  });

  it.each([0, -1, 1.5, '2', null, Number.MAX_SAFE_INTEGER + 1])('rejects invalid quantity %s before a write', async quantity => {
    const app = services();

    const result = await createShopTools(app)[1].execute({ productId: 11, quantity });

    expect(result.isError).toBe(true);
    expect(app.addToCart).not.toHaveBeenCalled();
    expect(app.onCart).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, '11', null])('rejects invalid product ID %s before a write', async productId => {
    const app = services();

    const result = await createShopTools(app)[1].execute({ productId, quantity: 1 });

    expect(result.isError).toBe(true);
    expect(app.addToCart).not.toHaveBeenCalled();
  });

  it.each([null, [], 'query', { query: 1 }, { query: 'x'.repeat(201) }, { query: '', inStockOnly: 'true' }, { query: '', extra: true }])('rejects malformed search arguments %j', async input => {
    const app = services();

    const result = await createShopTools(app)[0].execute(input);

    expect(result.isError).toBe(true);
    expect(app.getProducts).not.toHaveBeenCalled();
  });

  it('returns backend rejection as an error result and preserves the display', async () => {
    const app = services();
    vi.mocked(app.addToCart).mockRejectedValue(new Error('Insufficient stock'));
    const calls = vi.fn();

    const result = await createShopTools(app, 'none', calls)[1].execute({ productId: 11, quantity: 9 });

    expect(result.isError).toBe(true);
    expect(decode(result)).toEqual({ error: 'Insufficient stock' });
    expect(app.onCart).not.toHaveBeenCalled();
    expect(calls).toHaveBeenCalledWith({ name: 'add_to_cart', input: { productId: 11, quantity: 9 }, result });
  });

  it('reads the current cart from the application service', async () => {
    const app = services();

    const result = await createShopTools(app)[2].execute({});

    expect(decode(result)).toEqual(filled);
    expect(app.getCart).toHaveBeenCalledOnce();
    expect(app.onCart).toHaveBeenCalledWith(filled);
  });

  it('rejects extra cart arguments', async () => {
    const app = services();

    const result = await createShopTools(app)[2].execute({ username: 'another-user' });

    expect(result.isError).toBe(true);
    expect(app.getCart).not.toHaveBeenCalled();
  });

  it('keeps deliberately stale UI separate from the saved cart result', async () => {
    const app = services();

    const result = await createShopTools(app, 'stale-cart')[1].execute({ productId: 11, quantity: 2 });

    expect(decode(result).totalItems).toBe(2);
    expect(app.onCart).not.toHaveBeenCalled();
  });

  it('demonstrates the wrong-product adapter with an available product in the same category', async () => {
    const app = services();

    await createShopTools(app, 'wrong-product')[1].execute({ productId: 11, quantity: 2 });

    expect(app.addToCart).toHaveBeenCalledWith(12, 2);
  });

  it('reports when the wrong-product demonstration has no alternative', async () => {
    const app = services();
    vi.mocked(app.getProducts).mockResolvedValue([cheap]);

    const result = await createShopTools(app, 'wrong-product')[1].execute({ productId: 11, quantity: 2 });

    expect(result.isError).toBe(true);
    expect(app.addToCart).not.toHaveBeenCalled();
  });

  it('uses a safe fallback for non-Error failures', async () => {
    const app = services();
    vi.mocked(app.getCart).mockRejectedValue(null);

    const result = await createShopTools(app)[2].execute({});

    expect(result.isError).toBe(true);
    expect(decode(result).error).toBe('Application request failed.');
  });

  it('registers with an abort signal and stops registration on cancellation', async () => {
    const controller = new AbortController();
    const tools = createShopTools(services());
    const registerTool = vi.fn(async (_tool: ShopTool, options: { signal: AbortSignal }) => {
      expect(options.signal).toBe(controller.signal);
      controller.abort();
    });

    await registerShopTools({ registerTool }, tools, controller.signal);

    expect(registerTool).toHaveBeenCalledOnce();
  });

  it('supports empty and unfiltered catalogues and safe fault selection', () => {
    expect(filterProducts([], '', false)).toEqual([]);
    expect(filterProducts([cheap, unavailable], ' ', false).map(value => value.id)).toEqual([13, 11]);
    expect(readFault(null)).toBe('none');
    expect(readFault('toString')).toBe('none');
    expect(readFault('broken-button')).toBe('broken-button');
  });
});
