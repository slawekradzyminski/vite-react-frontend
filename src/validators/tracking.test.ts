import { describe, expect, it } from 'vitest';
import { trackingLookupSchema } from './tracking';

describe('trackingLookupSchema', () => {
  it('normalises a pasted number', () => {
    // given / when
    const result = trackingLookupSchema.safeParse({ trackingNumber: ' 1z 12345 ' });

    // then
    expect(result.success && result.data.trackingNumber).toBe('1Z12345');
  });

  it.each([
    ['', 'Enter a tracking number'],
    ['   ', 'Enter a tracking number'],
    ['ABC-123', 'Use letters and digits only'],
    ['1'.repeat(41), 'Tracking numbers are at most 40 characters'],
  ])('rejects %j', (value, message) => {
    // when
    const result = trackingLookupSchema.safeParse({ trackingNumber: value });

    // then
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });
});
