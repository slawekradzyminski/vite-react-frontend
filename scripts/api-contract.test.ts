import { describe, expect, it } from 'vitest';
import {
  DEFAULT_API_DOCS_URL,
  DEFAULT_PAYMENT_API_DOCS_URL,
  DEFAULT_WAREHOUSE_API_DOCS_URL,
  describeDrift,
  resolveTarget,
  serializeSpec,
} from './api-contract.mjs';

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

  describe('resolveTarget', () => {
    it('defaults to the backend snapshot and gateway URL', () => {
      expect(resolveTarget(['check'])).toMatchObject({
        command: 'check',
        serviceName: 'backend',
        service: { snapshot: 'openapi/backend-api-docs.json' },
        url: DEFAULT_API_DOCS_URL,
      });
    });

    it('keeps accepting a bare URL for the backend', () => {
      expect(resolveTarget(['check', 'http://localhost:4001/v3/api-docs'])).toMatchObject({
        serviceName: 'backend',
        url: 'http://localhost:4001/v3/api-docs',
      });
    });

    it('targets the warehouse snapshot and its gateway URL', () => {
      expect(resolveTarget(['snapshot', 'warehouse'])).toMatchObject({
        serviceName: 'warehouse',
        service: { snapshot: 'openapi/warehouse-api-docs.json' },
        url: DEFAULT_WAREHOUSE_API_DOCS_URL,
      });
      expect(DEFAULT_WAREHOUSE_API_DOCS_URL).toBe('http://localhost:8081/warehouse/v3/api-docs');
    });

    it('targets the payment snapshot and its gateway URL', () => {
      expect(resolveTarget(['check', 'payment'])).toMatchObject({
        serviceName: 'payment',
        service: { snapshot: 'openapi/payment-api-docs.json', urlEnv: 'PAYMENT_API_DOCS_URL', snapshotScript: 'api:snapshot:payment' },
        url: DEFAULT_PAYMENT_API_DOCS_URL,
      });
      expect(DEFAULT_PAYMENT_API_DOCS_URL).toBe('http://localhost:8081/payment/v3/api-docs');
      expect(resolveTarget(['check', 'payment'], { PAYMENT_API_DOCS_URL: 'http://payment:4004/v3/api-docs' }).url)
        .toBe('http://payment:4004/v3/api-docs');
    });

    it('prefers an explicit URL over the service environment variable', () => {
      const env = { WAREHOUSE_API_DOCS_URL: 'http://warehouse:4003/v3/api-docs', BACKEND_API_DOCS_URL: 'http://backend:4001/v3/api-docs' };

      expect(resolveTarget(['check', 'warehouse'], env).url).toBe('http://warehouse:4003/v3/api-docs');
      expect(resolveTarget(['check'], env).url).toBe('http://backend:4001/v3/api-docs');
      expect(resolveTarget(['check', 'warehouse', 'http://localhost:4003/v3/api-docs'], env).url).toBe('http://localhost:4003/v3/api-docs');
    });
  });
});
