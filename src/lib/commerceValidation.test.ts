import { describe, expect, it } from 'vitest';
import { validateCouponForm, validateReview, validateTracking, validateWeight, type CouponForm } from './commerceValidation';

const coupon = (overrides: Partial<CouponForm> = {}): CouponForm => ({
  code: 'WELCOME10', description: '', type: 'PERCENTAGE', value: '10', minOrderAmount: '', validFrom: '', validUntil: '',
  maxRedemptions: '', perUserLimit: '1', active: true, ...overrides,
});

describe('validateTracking', () => {
  it.each([
    ['INPOST', '123456789012345678901234', true],
    ['INPOST', '12345678901234567890123', false],
    ['DPD', '12345678901234', true],
    ['DHL', '1234567890', true],
    ['DHL', '123456789O', false],
    ['UPS', ' 1z999aa10123456784 ', true],
    ['UPS', '1Z999AA1012345678', false],
  ] as const)('%s %s valid=%s', (carrier, value, valid) => {
    expect(validateTracking(carrier, value) === null).toBe(valid);
  });

  it('explains the expected format', () => {
    expect(validateTracking('DHL', '1')).toBe('DHL tracking numbers are 10 digits.');
  });
});

describe('validateWeight', () => {
  it('accepts the inclusive bounds and two decimals', () => {
    expect(validateWeight('0.01')).toBeNull();
    expect(validateWeight('30')).toBeNull();
    expect(validateWeight('12.5')).toBeNull();
  });

  it('rejects empty, out-of-range and over-precise weights', () => {
    expect(validateWeight('')).toBe('Enter the package weight.');
    expect(validateWeight('0')).toBe('Weight must be between 0.01 and 30.00 kg.');
    expect(validateWeight('30.01')).toBe('Weight must be between 0.01 and 30.00 kg.');
    expect(validateWeight('1.234')).toBe('Use at most two decimals.');
  });
});

describe('validateCouponForm', () => {
  it('accepts a valid definition', () => {
    expect(validateCouponForm(coupon())).toEqual({});
  });

  it('caps percentages at 100 but not fixed amounts', () => {
    expect(validateCouponForm(coupon({ value: '100.01' })).value).toBe('Percentage cannot exceed 100.');
    expect(validateCouponForm(coupon({ value: '100' })).value).toBeUndefined();
    expect(validateCouponForm(coupon({ type: 'FIXED_AMOUNT', value: '250' })).value).toBeUndefined();
  });

  it('rejects malformed codes, reversed windows and non-positive limits', () => {
    const errors = validateCouponForm(coupon({
      code: 'no spaces', validFrom: '2026-12-01T10:00', validUntil: '2026-12-01T10:00', maxRedemptions: '0', perUserLimit: '1.5',
    }));
    expect(Object.keys(errors).sort()).toEqual(['code', 'maxRedemptions', 'perUserLimit', 'validUntil']);
  });
});

describe('validateReview', () => {
  it('requires a rating and trimmed lengths', () => {
    expect(validateReview({ rating: 0, title: '  ab ', body: 'too short' })).toEqual({
      rating: 'Choose a rating from 1 to 5.',
      title: 'Title must be between 3 and 120 characters.',
      body: 'Review must be between 10 and 2000 characters.',
    });
    expect(validateReview({ rating: 5, title: 'Great', body: 'Works as described.' })).toEqual({});
  });
});
