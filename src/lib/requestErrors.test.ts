import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { describeCartError, retryServerErrors } from './requestErrors';

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
