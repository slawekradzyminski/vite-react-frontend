import { describe, expect, it } from 'vitest';
import { trafficPresentation } from './trafficPresentation';
import type { TrafficEventDto } from '../types/traffic';

const event: TrafficEventDto = { method: 'POST', path: '/api/v1/graphql', status: 200, durationMs: 8, timestamp: '2026-09-20T10:00:00Z' };

describe('protocol traffic presentation', () => {
  it.each([
    ['SUCCESS', 'Success · HTTP 200', 'text-emerald-600'],
    ['PARTIAL_ERROR', 'Partial error · HTTP 200', 'text-red-600'],
    ['ERROR', 'Error · HTTP 200', 'text-red-600'],
  ] as const)('classifies GraphQL %s independently of HTTP 200', (outcome, status, color) => {
    // given
    const input: TrafficEventDto = { ...event, protocolDetails: {
      protocol: 'GRAPHQL', operation: 'query cart,products', outcome, codes: [], correlationId: 'correlation',
    } };
    // when
    const result = trafficPresentation(input);
    // then
    expect(result).toEqual({ protocol: 'GraphQL', status, color, operation: 'query cart,products', correlationId: 'correlation' });
  });

  it.each([
    [0, 'OK', 'SUCCESS', 'text-emerald-600'],
    [7, 'PERMISSION_DENIED', 'ERROR', 'text-red-600'],
    [16, 'UNAUTHENTICATED', 'ERROR', 'text-red-600'],
  ] as const)('shows native gRPC code %s', (status, code, outcome, color) => {
    // given
    const input: TrafficEventDto = { ...event, status, protocolDetails: {
      protocol: 'GRPC', operation: 'AdjustStock', outcome, codes: [code], correlationId: 'native',
    } };
    // when
    const result = trafficPresentation(input);
    // then
    expect(result).toEqual({ protocol: 'gRPC', status: `${code} (${status})`, color, operation: 'AdjustStock', correlationId: 'native' });
  });

  it.each([
    [199, ''], [200, 'text-emerald-600'], [299, 'text-emerald-600'],
    [300, 'text-sky-600'], [399, 'text-sky-600'], [400, 'text-orange-600'],
    [499, 'text-orange-600'], [500, 'text-red-600'],
  ])('preserves REST status %s', (status, color) => {
    // given / when
    const result = trafficPresentation({ ...event, status: Number(status), method: 'GET' });
    // then
    expect(result).toEqual({ protocol: 'REST', status: String(status), color, operation: '', correlationId: '' });
  });
});
