import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { describeCartError, retryServerErrors, serverMessage } from './requestErrors';

const httpError = (status: number) =>
  new AxiosError('failed', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });

describe('retryServerErrors', () => {
  it.each([400, 404, 409])('does not retry HTTP %i', (status) => {
    expect(retryServerErrors(0, httpError(status))).toBe(false);
  });

  it('retries server and network errors up to three times', () => {
    expect(retryServerErrors(0, httpError(500))).toBe(true);
    expect(retryServerErrors(2, new Error('network'))).toBe(true);
    expect(retryServerErrors(3, httpError(503))).toBe(false);
  });
});

describe('describeCartError', () => {
  it('explains stock conflicts and missing products', () => {
    expect(describeCartError(httpError(409), 'fallback')).toBe('Not enough stock for the requested quantity.');
    expect(describeCartError(httpError(404), 'fallback')).toBe('This product is no longer available.');
  });

  it('falls back for other failures', () => {
    expect(describeCartError(httpError(500), 'fallback')).toBe('fallback');
    expect(describeCartError(new Error('network'), 'fallback')).toBe('fallback');
  });
});

describe('serverMessage', () => {
  const axiosError = (data: unknown) => Object.assign(new Error('Request failed'), { isAxiosError: true, response: { status: 400, data } });

  it('prefers the ErrorDto message', () => {
    expect(serverMessage(axiosError({ message: 'Coupon has expired' }), 'fallback')).toBe('Coupon has expired');
  });

  it('falls back to the first validation message or error map', () => {
    expect(serverMessage(axiosError({ code: 'Coupon code is required' }), 'fallback')).toBe('Coupon code is required');
    expect(serverMessage(axiosError({ error: 'lowStockThreshold must be at least 1' }), 'fallback')).toBe('lowStockThreshold must be at least 1');
  });

  it('uses the fallback for non-HTTP errors and empty bodies', () => {
    expect(serverMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(serverMessage(axiosError(null), 'fallback')).toBe('fallback');
    expect(serverMessage(axiosError({ message: '  ' }), 'fallback')).toBe('fallback');
  });
});
