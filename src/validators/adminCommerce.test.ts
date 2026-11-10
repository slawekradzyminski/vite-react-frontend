import { describe, expect, it } from 'vitest';
import { currencySchema, giftCardSchema, vatRateSchema } from './adminCommerce';

const errorsOf = (result: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }) =>
  result.error?.flatten().fieldErrors ?? {};

describe('vatRateSchema', () => {
  const valid = { countryCode: 'PL', countryName: 'Poland', rate: '23' };

  it.each(['0', '23', '7.5', '19.99', '50'])('accepts the rate %s', (rate) => {
    // given / when / then
    expect(vatRateSchema.safeParse({ ...valid, rate }).success).toBe(true);
  });

  it.each([
    ['', 'Rate is required'],
    ['abc', 'Rate must be a number'],
    ['-1', 'Rate must be a number'],
    ['50.01', 'Rate must be between 0 and 50'],
    ['51', 'Rate must be between 0 and 50'],
    ['7.125', 'Use at most 2 decimal places'],
  ])('rejects the rate "%s"', (rate, message) => {
    // given / when
    const errors = errorsOf(vatRateSchema.safeParse({ ...valid, rate }));

    // then
    expect(errors.rate).toEqual([message]);
  });

  it('requires a 2-letter code and a country name', () => {
    // given / when
    const errors = errorsOf(vatRateSchema.safeParse({ countryCode: 'POL', countryName: ' ', rate: '1' }));

    // then
    expect(errors.countryCode).toContain('Use a 2-letter ISO country code');
    expect(errors.countryName).toContain('Country name is required');
  });
});

describe('currencySchema', () => {
  const valid = { code: 'EUR', name: 'Euro', symbol: '€', rateToUsd: '1.08' };

  it('accepts a valid currency', () => {
    // given / when / then
    expect(currencySchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['0', 'Rate must be above 0 and at most 999999.999999'],
    ['1000000', 'Rate must be above 0 and at most 999999.999999'],
    ['1.1234567', 'Use at most 6 decimal places'],
    ['x', 'Rate must be a number'],
  ])('rejects the rate "%s"', (rateToUsd, message) => {
    // given / when
    const errors = errorsOf(currencySchema.safeParse({ ...valid, rateToUsd }));

    // then
    expect(errors.rateToUsd).toContain(message);
  });

  it('keeps USD at a rate of 1', () => {
    // given / when
    const locked = errorsOf(currencySchema.safeParse({ code: 'usd', name: 'US Dollar', symbol: '$', rateToUsd: '1.5' }));
    const base = currencySchema.safeParse({ code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: '1' });

    // then
    expect(locked.rateToUsd).toContain('USD is the base currency and its rate must stay 1');
    expect(base.success).toBe(true);
  });

  it('requires a 3-letter code, a name and a short symbol', () => {
    // given / when
    const errors = errorsOf(currencySchema.safeParse({ code: 'EU', name: '', symbol: '123456789', rateToUsd: '1' }));

    // then
    expect(errors.code).toContain('Use a 3-letter ISO currency code');
    expect(errors.name).toContain('Name is required');
    expect(errors.symbol).toContain('Symbol must be at most 8 characters');
  });
});

describe('giftCardSchema', () => {
  const valid = { amount: '50', recipientUsername: '', note: '', expiresAt: '' };

  it.each(['1', '50.25', '1000'])('accepts the amount %s', (amount) => {
    // given / when / then
    expect(giftCardSchema.safeParse({ ...valid, amount }).success).toBe(true);
  });

  it.each([
    ['', 'Amount is required'],
    ['0.99', 'Amount must be between 1 and 1000'],
    ['1000.01', 'Amount must be between 1 and 1000'],
    ['10.555', 'Use at most 2 decimal places'],
    ['ten', 'Amount must be a number'],
  ])('rejects the amount "%s"', (amount, message) => {
    // given / when
    const errors = errorsOf(giftCardSchema.safeParse({ ...valid, amount }));

    // then
    expect(errors.amount).toContain(message);
  });

  it('accepts a future expiry and rejects a past one', () => {
    // given / when
    const future = giftCardSchema.safeParse({ ...valid, expiresAt: '2999-01-01T10:00' });
    const past = errorsOf(giftCardSchema.safeParse({ ...valid, expiresAt: '2000-01-01T10:00' }));

    // then
    expect(future.success).toBe(true);
    expect(past.expiresAt).toContain('Expiry must be in the future');
  });
});
