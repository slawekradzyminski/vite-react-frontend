import { describe, expect, it } from 'vitest';
import { webhookSchema, webhookServerErrors } from './webhook';

const valid = { url: 'https://example.com/hook', events: ['order.created'], description: '', active: true };

describe('webhookSchema', () => {
  it.each(['https://example.com/hook', 'http://example.com', 'inbox://abc123'])('accepts %s', (url) => {
    // given / when
    const result = webhookSchema.safeParse({ ...valid, url });

    // then
    expect(result.success).toBe(true);
  });

  it.each([
    ['', 'URL is required'],
    ['   ', 'URL is required'],
    ['ftp://example.com', 'Use an http(s):// URL or an inbox:// URL'],
    ['example.com', 'Use an http(s):// URL or an inbox:// URL'],
    [`https://example.com/${'a'.repeat(2048)}`, 'URL must be at most 2048 characters'],
  ])('rejects the URL "%s"', (url, message) => {
    // given / when
    const result = webhookSchema.safeParse({ ...valid, url });

    // then
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.url).toContain(message);
  });

  it('requires at least one event and a short description', () => {
    // given / when
    const result = webhookSchema.safeParse({ ...valid, events: [], description: 'x'.repeat(256) });

    // then
    const errors = result.error?.flatten().fieldErrors;
    expect(errors?.events).toContain('Select at least one event');
    expect(errors?.description).toContain('Description must be at most 255 characters');
  });
});

describe('webhookServerErrors', () => {
  it('places an SSRF rejection under the URL field', () => {
    // given
    const data = { message: 'Webhook URL rejected: Host 10.0.0.1 resolves to a private address' };

    // when / then
    expect(webhookServerErrors(data)).toEqual([{ field: 'url', message: data.message }]);
  });

  it('places an unknown event type under the events field', () => {
    // given
    const data = { message: "Unknown event type 'x'. Allowed: order.created" };

    // when / then
    expect(webhookServerErrors(data)).toEqual([{ field: 'events', message: data.message }]);
  });

  it('keeps other messages at form level', () => {
    // given / when / then
    expect(webhookServerErrors({ message: 'Too many subscriptions' })).toEqual([{ message: 'Too many subscriptions' }]);
  });

  it('maps a field validation map to its fields', () => {
    // given
    const data = { url: 'must not be blank', description: 'size must be between 0 and 255', other: 5 };

    // when / then
    expect(webhookServerErrors(data)).toEqual([
      { field: 'url', message: 'must not be blank' },
      { field: 'description', message: 'size must be between 0 and 255' },
    ]);
  });

  it('returns nothing for an empty or missing body', () => {
    // given / when / then
    expect(webhookServerErrors(undefined)).toEqual([]);
    expect(webhookServerErrors('text')).toEqual([]);
    expect(webhookServerErrors({ message: '  ' })).toEqual([]);
  });
});
