import { describe, expect, it } from 'vitest';
import { describeDrift, serializeSpec } from './api-contract.mjs';

const spec = (overrides: Record<string, unknown> = {}) => ({
  openapi: '3.1.0',
  servers: [{ url: 'http://localhost:8081' }],
  paths: { '/api/v1/cart': { get: { operationId: 'getCart' } } },
  components: {
    schemas: {
      CartDto: { type: 'object', properties: { totalItems: { type: 'integer' }, items: { type: 'array' } } },
    },
  },
  ...overrides,
});

describe('api-contract', () => {
  it('produces the same snapshot whichever host served the document', () => {
    const viaGateway = spec();
    const direct = { ...spec(), servers: [{ url: 'http://backend:4001' }] };

    expect(serializeSpec(viaGateway)).toBe(serializeSpec(direct));
    expect(describeDrift(viaGateway, direct)).toEqual([]);
  });

  it('ignores property order', () => {
    const reordered = spec({
      components: {
        schemas: {
          CartDto: { properties: { items: { type: 'array' }, totalItems: { type: 'integer' } }, type: 'object' },
        },
      },
    });

    expect(describeDrift(spec(), reordered)).toEqual([]);
  });

  it('names every path and schema that changed', () => {
    const actual = spec({
      paths: { '/api/v1/orders': { get: { operationId: 'getOrders' } } },
      components: {
        schemas: {
          CartDto: { type: 'object', properties: { itemCount: { type: 'integer' }, items: { type: 'array' } } },
          OrderDto: { type: 'object' },
        },
      },
    });

    expect(describeDrift(spec(), actual)).toEqual([
      '- path removed: /api/v1/cart',
      '+ path added: /api/v1/orders',
      '~ schema changed: CartDto',
      '+ schema added: OrderDto',
    ]);
  });

  it('reports changes outside paths and schemas', () => {
    expect(describeDrift(spec(), spec({ openapi: '3.0.1' }))).toEqual(['~ document changed outside paths and schemas']);
  });
});
