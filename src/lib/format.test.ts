import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats US dollars with thousands separators and two decimals', () => {
    expect(formatPrice(1999.99)).toBe('$1,999.99');
    expect(formatPrice(99999999.99)).toBe('$99,999,999.99');
    expect(formatPrice(12.5)).toBe('$12.50');
    expect(formatPrice(0)).toBe('$0.00');
  });
});
