import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatTime, localInputToUtcIso, parseUtcDateTime, utcToLocalInput } from './commerceFormat';

describe('UTC date-time helpers in a browser east of UTC', () => {
  const originalZone = process.env.TZ;
  beforeAll(() => { process.env.TZ = 'Pacific/Auckland'; });
  afterAll(() => { process.env.TZ = originalZone; });

  it('sends a datetime-local value as the same instant in UTC', () => {
    // given: 23:58 in Auckland on 12 November is 10:58 UTC (NZDT, UTC+13)
    const picked = '2026-11-12T23:58';

    // when
    const sent = localInputToUtcIso(picked);

    // then
    expect(sent).toBe('2026-11-12T10:58:00.000Z');
  });

  it('reads a zone-less backend value as UTC and keeps explicit offsets', () => {
    expect(parseUtcDateTime('2026-11-12T10:58:00').toISOString()).toBe('2026-11-12T10:58:00.000Z');
    expect(parseUtcDateTime('2026-11-12T10:58:00.123456').toISOString()).toBe('2026-11-12T10:58:00.123Z');
    expect(parseUtcDateTime('2026-11-12T10:58:00Z').toISOString()).toBe('2026-11-12T10:58:00.000Z');
    expect(parseUtcDateTime('2026-11-12T23:58:00+13:00').toISOString()).toBe('2026-11-12T10:58:00.000Z');
    expect(parseUtcDateTime('2026-11-12T23:58:00+1300').toISOString()).toBe('2026-11-12T10:58:00.000Z');
  });

  it('shows a backend UTC value as the local datetime-local value it was picked as', () => {
    expect(utcToLocalInput('2026-11-12T10:58:00')).toBe('2026-11-12T23:58');
    expect(utcToLocalInput('2026-12-31T11:30:00.123456')).toBe('2027-01-01T00:30');
    expect(utcToLocalInput(localInputToUtcIso('2026-07-01T08:05'))).toBe('2026-07-01T08:05');
    expect(utcToLocalInput(null)).toBe('');
    expect(utcToLocalInput('')).toBe('');
  });

  it('displays the value in the browser zone', () => {
    expect(formatDateTime('2026-11-12T10:58:00')).toBe(new Date(2026, 10, 12, 23, 58).toLocaleString());
    expect(formatDate('2026-12-31T12:00:00')).toBe(new Date(2027, 0, 1).toLocaleDateString());
    expect(formatDateTime(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('backend timestamps in Central European Time', () => {
  const originalZone = process.env.TZ;
  beforeAll(() => { process.env.TZ = 'Europe/Warsaw'; });
  afterAll(() => { process.env.TZ = originalZone; });

  it('shows a naive backend timestamp as UTC, not one hour off', () => {
    // given: 19:30:50 UTC is 20:30:50 in Warsaw (CET, UTC+1)
    const paymentAttempt = '2026-11-24T19:30:50.189678';

    // then
    expect(parseUtcDateTime(paymentAttempt).toISOString()).toBe('2026-11-24T19:30:50.189Z');
    expect(formatDateTime(paymentAttempt)).toBe(new Date(2026, 10, 24, 20, 30, 50).toLocaleString());
    expect(formatTime(paymentAttempt, { hour: '2-digit', minute: '2-digit' }))
      .toBe(new Date(2026, 10, 24, 20, 30).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  });

  it('shows the same instant for a naive value and its Z or offset form', () => {
    const local = new Date(2026, 10, 24, 20, 30, 50).toLocaleString();
    expect(formatDateTime('2026-11-24T19:30:50Z')).toBe(local);
    expect(formatDateTime('2026-11-24T20:30:50+01:00')).toBe(local);
    expect(formatDateTime('2026-11-24T19:30:50')).toBe(local);
    expect(formatDateTime('2026-11-24T19:30')).toBe(new Date(2026, 10, 24, 20, 30).toLocaleString());
  });

  it('uses the UTC date, which can be the next local day', () => {
    expect(formatDate('2026-12-31T23:30:00')).toBe(new Date(2027, 0, 1).toLocaleDateString());
  });

  it('keeps a date-only value parseable', () => {
    expect(parseUtcDateTime('2026-11-24').toISOString()).toBe('2026-11-24T00:00:00.000Z');
  });

  it('renders a dash for a missing or unparsable value', () => {
    expect(formatDateTime('not a date')).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatTime(null)).toBe('—');
  });
});
