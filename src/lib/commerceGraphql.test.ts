import axios from 'axios';
import { buildSchema, graphql, parse, validate } from 'graphql';
import schemaText from './commerce.schema.graphql?raw';
const schema = buildSchema(schemaText);
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommerceGraphQlError, createCommerceGraphql } from './commerceGraphql';

const product = { id: '42', name: 'Book', description: 'Training', price: '999.99', stockQuantity: 8, category: 'Books', imageUrl: 'book.png' };
const cart = { username: 'alice', totalItems: 3, totalPrice: '2999.97', items: [{ product, quantity: 3, unitPrice: '999.99' }] };
const address = { street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zipCode: '00-001', country: 'Poland' };
const order = { id: '7', username: 'alice', totalAmount: '2999.97', status: 'PENDING', shippingAddress: address,
  createdAt: '2026-09-20T10:00:00', updatedAt: '2026-09-20T10:00:00',
  items: [{ id: '8', productId: '42', productName: 'Book', quantity: 3, unitPrice: '999.99', totalPrice: '2999.97' }] };
const inventory = { productId: '42', name: 'Book', category: 'Books', availableQuantity: 8, stockStatus: 'LOW_STOCK' };
const movement = { id: '9', productId: '42', orderId: null, type: 'ADMIN_ADJUSTMENT', delta: 3, quantityAfter: 8, actor: 'admin', reason: 'Restock', requestId: 'retry-id', createdAt: '2026-09-20T10:00:00' };
const paged = (item: unknown) => ({ items: [item], total: 1, page: 0, size: 10 });

function payload(value: unknown) {
  return value as { query: string; variables: Record<string, unknown> };
}

const recordedRequests: (() => unknown[])[] = [];
afterEach(() => {
  for (const requests of recordedRequests.splice(0)) {
    for (const request of requests()) expect(validate(schema, parse(payload(request).query))).toEqual([]);
  }
});

function setup(field: string, value: unknown) {
  const client = axios.create();
  const post = vi.spyOn(client, 'post').mockImplementation(async (_url, body) => {
    expect(validate(schema, parse(payload(body).query))).toEqual([]);
    return { data: { data: { [field]: value } } };
  });
  recordedRequests.push(() => post.mock.calls.map(([, body]) => body));
  return { client, post, api: createCommerceGraphql(client) };
}

describe('GraphQL commerce contracts', () => {
  it('executes every operation against the checked-in backend schema', async () => {
    // given
    const client = axios.create();
    const completeInventory = { ...inventory, lastChangedAt: '2026-09-20T10:00:00' };
    const rootValue = {
      product, products: { items: [product], total: 1 }, createProduct: product, updateProduct: product, deleteProduct: true,
      cart, addCartItem: cart, updateCartItem: cart, removeCartItem: cart, clearCart: cart,
      order, orders: paged(order), checkout: order, cancelOrder: order, updateOrderStatus: order,
      inventory: paged(completeInventory), inventoryItem: completeInventory, inventoryMovements: paged(movement), adjustInventory: movement,
    };
    vi.spyOn(client, 'post').mockImplementation(async (_url, body) => ({ data: await graphql({
      schema, source: payload(body).query, variableValues: payload(body).variables, rootValue,
    }) }));
    vi.spyOn(client, 'get').mockResolvedValue({ data: { username: 'alice' } });
    const api = createCommerceGraphql(client);
    // when
    const products = await Promise.all([
      api.products.getAllProducts(), api.products.getProductById(42),
      api.products.createProduct({ name: product.name, description: product.description, price: 999.99, stockQuantity: 8, category: 'Books', imageUrl: '' }), api.products.updateProduct(42, { price: 999.99 }),
    ]);
    const carts = await Promise.all([api.cart.getCart(), api.cart.addToCart({ productId: 42, quantity: 3 }),
      api.cart.updateCartItem(42, { quantity: 3 }), api.cart.removeFromCart(42), api.cart.clearCart()]);
    const orders = await Promise.all([api.orders.getOrderById(7), api.orders.createOrder(address),
      api.orders.cancelOrder(7), api.orders.updateOrderStatus(7, 'PAID')]);
    const ownOrders = await api.orders.getUserOrders();
    const allOrders = await api.orders.getAllOrders();
    const stock = await api.inventory.list();
    const detail = await api.inventory.get(42);
    const history = await api.inventory.movements(42);
    const adjusted = await api.inventory.adjust(42, { delta: 3, reason: 'Restock', requestId: 'retry-id' });
    const deleted = await api.products.deleteProduct(42);
    // then
    const expectedProduct = { ...product, id: 42, price: 999.99 };
    expect(products.map(response => response.data)).toEqual([[expectedProduct], expectedProduct, expectedProduct, expectedProduct]);
    for (const response of carts) expect(response.data).toMatchObject({ username: 'alice', enriched: true, totalItems: 3, totalPrice: 2999.97,
      items: [{ productId: 42, productName: 'Book', imageUrl: 'book.png', quantity: 3, unitPrice: 999.99, totalPrice: 2999.97 }] });
    const expectedOrder = { ...order, id: 7, totalAmount: 2999.97,
      items: [{ ...order.items[0], id: 8, productId: 42, unitPrice: 999.99, totalPrice: 2999.97 }] };
    for (const response of orders) expect(response.data).toEqual(expectedOrder);
    expect(ownOrders.data.content).toEqual([expectedOrder]);
    expect(allOrders.data.content).toEqual([expectedOrder]);
    expect(stock.data.content).toEqual([{ ...completeInventory, productId: 42 }]);
    expect(detail.data).toEqual({ ...completeInventory, productId: 42 });
    expect(history.data.content).toEqual([{ ...movement, id: 9, productId: 42 }]);
    expect(adjusted.data).toEqual({ ...movement, id: 9, productId: 42 });
    expect(deleted.data).toBe(true);
  });

  it('maps nested cart data and snapshot decimal totals without additional requests', async () => {
    // given
    const { api, post } = setup('cart', cart);
    // when
    const result = await api.cart.getCart();
    // then
    expect(result.data).toEqual({ username: 'alice', enriched: true, totalItems: 3, totalPrice: 2999.97,
      items: [{ productId: 42, productName: 'Book', quantity: 3, unitPrice: 999.99, totalPrice: 2999.97, imageUrl: 'book.png' }] });
    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith('/api/v1/graphql', expect.objectContaining({ variables: {} }));
  });

  it('loads every catalog page rather than truncating the storefront', async () => {
    // given
    const { api, post } = setup('products', { items: [product], total: 2 });
    post.mockResolvedValueOnce({ data: { data: { products: { items: [product], total: 2 } } } })
      .mockResolvedValueOnce({ data: { data: { products: { items: [{ ...product, id: '43' }], total: 2 } } } });
    // when
    const result = await api.products.getAllProducts();
    // then
    expect(result.data.map(item => item.id)).toEqual([42, 43]);
    expect(result.data[0].price).toBe(999.99);
    expect(post.mock.calls.map(call => payload(call[1]).variables.offset)).toEqual([0, 1]);
  });

  it('keeps an administrator’s profile order list scoped to their own identity', async () => {
    // given
    const { api, client, post } = setup('orders', paged(order));
    vi.spyOn(client, 'get').mockResolvedValue({ data: { username: 'admin' } });
    // when
    const result = await api.orders.getUserOrders(0, 10, 'PENDING');
    // then
    expect(client.get).toHaveBeenCalledWith('/api/v1/users/me');
    expect(payload(post.mock.calls[0][1]).variables).toEqual({ username: 'admin', page: 0, size: 10, status: 'PENDING' });
    expect(result.data).toMatchObject({ totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 10 });
    expect(result.data.content[0]).toMatchObject({ id: 7, totalAmount: 2999.97, items: [{ id: 8, productId: 42, unitPrice: 999.99 }] });
  });

  it('leaves the admin order management listing unscoped', async () => {
    // given
    const { api, post } = setup('orders', paged(order));
    // when
    await api.orders.getAllOrders(2, 10, 'PAID');
    // then
    expect(payload(post.mock.calls[0][1]).variables).toEqual({ page: 2, size: 10, status: 'PAID' });
  });

  it('rejects partial data accompanied by GraphQL execution errors', async () => {
    // given
    const { api, post } = setup('cart', cart);
    post.mockResolvedValue({ data: { data: { cart }, errors: [{ message: 'Access denied', extensions: { code: 'FORBIDDEN' } }] } });
    // when
    const request = api.cart.getCart();
    // then
    await expect(request).rejects.toMatchObject({ name: 'CommerceGraphQlError', code: 'FORBIDDEN', message: 'Access denied' });
    expect(post).toHaveBeenCalledOnce();
  });

  it('does not retry checkout or fall back to REST after an uncertain network failure', async () => {
    // given
    const { api, post, client } = setup('checkout', order);
    post.mockRejectedValue(new Error('Connection lost'));
    const get = vi.spyOn(client, 'get');
    // when
    const request = api.orders.createOrder(address);
    // then
    await expect(request).rejects.toThrow('Connection lost');
    expect(post).toHaveBeenCalledOnce();
    expect(get).not.toHaveBeenCalled();
  });

  it.each([null, undefined])('rejects an absent result (%s)', async value => {
    // given
    const { api } = setup('cart', value);
    // when
    const request = api.cart.getCart();
    // then
    await expect(request).rejects.toThrow('GraphQL returned no commerce data');
  });

  it('accepts the first product ID and supplies a missing image fallback', async () => {
    // given
    const { api } = setup('cart', { ...cart, items: [{ product: { ...product, id: '1', imageUrl: null }, quantity: 3, unitPrice: '999.99' }] });
    // when
    const result = await api.cart.getCart();
    // then
    expect(result.data.items[0]).toMatchObject({ productId: 1, imageUrl: '' });
  });

  it('rejects a response without a data envelope', async () => {
    // given
    const { api, post } = setup('cart', cart);
    post.mockResolvedValue({ data: {} });
    // when
    const request = api.cart.getCart();
    // then
    await expect(request).rejects.toThrow('GraphQL returned no commerce data');
  });

  it('stops catalog paging if concurrent deletion leaves an empty page', async () => {
    // given
    const { api, post } = setup('products', { items: [], total: 1 });
    // when
    const result = await api.products.getAllProducts();
    // then
    expect(result.data).toEqual([]);
    expect(post).toHaveBeenCalledOnce();
  });

  it('keeps default pagination when callers pass optional undefined values', async () => {
    // given
    const { api, post } = setup('inventory', paged(inventory));
    // when
    await api.inventory.list({ page: undefined, size: undefined, lowStockThreshold: undefined });
    // then
    expect(payload(post.mock.calls[0][1]).variables).toEqual({ page: 0, size: 20, lowStockThreshold: 10 });
  });

  it('preserves a false deletion result', async () => {
    // given
    const { api } = setup('deleteProduct', false);
    // when
    const result = await api.products.deleteProduct(42);
    // then
    expect(result.data).toBe(false);
  });

  it.each(['9007199254740993', '1.5', '0'])('rejects an unsafe product identifier %s', async value => {
    // given
    const { api } = setup('product', { ...product, id: value });
    // when
    const request = api.products.getProductById(42);
    // then
    await expect(request).rejects.toThrow('Unsupported commerce identifier');
  });

  it.each(['NaN', '1.234', ''])('rejects invalid decimal money %s', async value => {
    // given
    const { api } = setup('product', { ...product, price: value });
    // when
    const request = api.products.getProductById(42);
    // then
    await expect(request).rejects.toThrow('Invalid commerce money value');
  });

  it('preserves inventory filters and adjustment idempotency keys', async () => {
    // given
    const { api, post } = setup('inventory', paged(inventory));
    const input = { delta: 3, reason: 'Restock', requestId: 'retry-id' };
    // when
    const listing = await api.inventory.list({ page: 2, size: 10, status: 'LOW_STOCK', search: 'Book', category: 'Books', lowStockThreshold: 9 });
    post.mockResolvedValue({ data: { data: { adjustInventory: movement } } });
    const adjusted = await api.inventory.adjust(42, input);
    // then
    expect(payload(post.mock.calls[0][1]).variables).toEqual({ page: 2, size: 10, status: 'LOW_STOCK', search: 'Book', category: 'Books', lowStockThreshold: 9 });
    expect(payload(post.mock.calls[1][1]).variables).toEqual({ id: '42', input });
    expect(listing.data.content[0].productId).toBe(42);
    expect(adjusted.data).toMatchObject({ id: 9, productId: 42, orderId: null, requestId: 'retry-id', quantityAfter: 8 });
  });

  it('maps product inputs to decimal strings while preserving omitted fields', async () => {
    // given
    const { api, post } = setup('createProduct', product);
    const input = { name: 'Book', description: 'Training', price: 12.34, stockQuantity: 8, category: 'Books' };
    // when
    await api.products.createProduct(input);
    post.mockResolvedValue({ data: { data: { updateProduct: product } } });
    await api.products.updateProduct(42, { description: 'New description' });
    // then
    expect(payload(post.mock.calls[0][1]).variables.input).toEqual({ ...input, price: '12.34' });
    expect(payload(post.mock.calls[1][1]).variables).toEqual({ id: '42', input: { description: 'New description' } });
  });

  it('uses named mutations and variables for cart and order writes', async () => {
    // given
    const { api, post } = setup('addCartItem', cart);
    // when
    await api.cart.addToCart({ productId: 42, quantity: 3 });
    post.mockResolvedValue({ data: { data: { updateCartItem: cart } } });
    await api.cart.updateCartItem(42, { quantity: 2 });
    post.mockResolvedValue({ data: { data: { removeCartItem: cart } } });
    await api.cart.removeFromCart(42);
    post.mockResolvedValue({ data: { data: { clearCart: { ...cart, items: [], totalItems: 0, totalPrice: '0' } } } });
    await api.cart.clearCart();
    post.mockResolvedValue({ data: { data: { checkout: order } } });
    await api.orders.createOrder(address);
    post.mockResolvedValue({ data: { data: { updateOrderStatus: order } } });
    await api.orders.updateOrderStatus(7, 'PAID');
    post.mockResolvedValue({ data: { data: { cancelOrder: order } } });
    await api.orders.cancelOrder(7);
    // then
    expect(post.mock.calls.map(call => payload(call[1]).variables)).toEqual([
      { id: '42', quantity: 3 }, { id: '42', quantity: 2 }, { id: '42' }, {}, { address }, { id: '7', status: 'PAID' }, { id: '7' },
    ]);
    expect(post.mock.calls.every(call => call[0] === '/api/v1/graphql' && payload(call[1]).query.startsWith('mutation '))).toBe(true);
  });

  it('reads order, inventory detail and movement history', async () => {
    // given
    const { api, post } = setup('order', order);
    // when
    const detail = await api.orders.getOrderById(7);
    post.mockResolvedValue({ data: { data: { inventoryItem: inventory } } });
    const stock = await api.inventory.get(42);
    post.mockResolvedValue({ data: { data: { inventoryMovements: paged({ ...movement, orderId: '7' }) } } });
    const history = await api.inventory.movements(42);
    // then
    expect(detail.data.id).toBe(7);
    expect(stock.data.availableQuantity).toBe(8);
    expect(history.data.content[0].orderId).toBe(7);
    expect(payload(post.mock.calls[1][1]).variables).toEqual({ id: '42', threshold: 10 });
    expect(payload(post.mock.calls[2][1]).variables).toEqual({ id: '42', page: 0, size: 20 });
  });

  it('exposes a stable generic code for schema validation errors', () => {
    // given
    const errors = [{ message: 'Unknown field' }, { message: 'Invalid argument' }];
    // when
    const error = new CommerceGraphQlError(errors);
    // then
    expect(error.code).toBe('GRAPHQL_ERROR');
    expect(error.message).toBe('Unknown field; Invalid argument');
  });
});
