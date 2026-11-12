import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatUtcDate, formatUtcDateTime, localInputToUtcIso, parseUtcDateTime } from './commerceFormat';

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

  it('displays the value in the browser zone', () => {
    expect(formatUtcDateTime('2026-11-12T10:58:00')).toBe(new Date(2026, 10, 12, 23, 58).toLocaleString());
    expect(formatUtcDate('2026-12-31T12:00:00')).toBe(new Date(2027, 0, 1).toLocaleDateString());
    expect(formatUtcDateTime(null)).toBe('—');
    expect(formatUtcDate(undefined)).toBe('—');
  });
});
