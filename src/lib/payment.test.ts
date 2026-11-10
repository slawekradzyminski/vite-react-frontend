import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cardDigits,
  describeCard,
  describePaymentFailure,
  formatCardNumber,
  formatExpiry,
  formatMoney,
  formatPoints,
  isExpiryInFuture,
  isFinalPaymentStatus,
  isLuhnValid,
  newIdempotencyKey,
  orderAmountDue,
  parseExpiry,
  pointsError,
  pointsValue,
  TEST_CARDS,
  wasCaptured,
} from './payment';

describe('isLuhnValid', () => {
  it.each(TEST_CARDS.map((card) => card.number))('accepts the contract test card %s', (number) => {
    // given a published test card
    // when / then
    expect(isLuhnValid(number)).toBe(true);
  });

  it.each([
    ['4242 4242 4242 4241', 'wrong check digit'],
    ['4242-4242-4242-4243', 'wrong check digit with dashes'],
    ['12345678901', 'too short (11 digits)'],
    ['42424242424242424242', 'too long (20 digits)'],
    ['4242 4242 abcd 4242', 'letters'],
    ['', 'empty'],
  ])('rejects %s (%s)', (number) => {
    // given an invalid number
    // when / then
    expect(isLuhnValid(number)).toBe(false);
  });

  it('accepts a valid 12-digit and 19-digit number and ignores separators', () => {
    // given numbers at both length limits that pass the checksum
    const twelve = '000000000000';
    const nineteen = '4111-1111-1111-1111-110';
    // when / then
    expect(isLuhnValid(twelve)).toBe(true);
    expect(cardDigits(nineteen)).toHaveLength(19);
    expect(isLuhnValid(nineteen)).toBe(isLuhnValid('4111111111111111110'));
  });

  it('doubles every second digit from the right, subtracting 9 above 9', () => {
    // given 59: 5 doubled is 10 -> 1, plus 9 = 10 -> valid; with leading zeros to reach 12 digits
    // when / then
    expect(isLuhnValid('000000000059')).toBe(true);
    expect(isLuhnValid('000000000058')).toBe(false);
    expect(isLuhnValid('000000000018')).toBe(true);
  });
});

describe('card input formatting', () => {
  it('groups digits in fours and drops other characters', () => {
    // given / when / then
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('4242-42a')).toBe('4242 42');
    expect(formatCardNumber('4242')).toBe('4242');
    expect(formatCardNumber('12345678901234567890123')).toBe('1234 5678 9012 3456 789');
  });

  it('inserts the slash after the month', () => {
    // given / when / then
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('123')).toBe('12/3');
    expect(formatExpiry('12/345')).toBe('12/34');
  });
});

describe('expiry', () => {
  it('parses MM/YY into a month and four-digit year', () => {
    // given / when / then
    expect(parseExpiry('07/29')).toEqual({ month: 7, year: 2029 });
    expect(parseExpiry(' 12 / 30 ')).toEqual({ month: 12, year: 2030 });
  });

  it.each(['13/29', '00/29', '7/29', '07/2029', 'ab/cd', ''])('rejects %s', (value) => {
    // given / when / then
    expect(parseExpiry(value)).toBeNull();
  });

  it('treats the current month as still valid and the previous month as expired', () => {
    // given 15 March 2027
    const now = new Date(2027, 2, 15);
    // when / then
    expect(isExpiryInFuture({ month: 3, year: 2027 }, now)).toBe(true);
    expect(isExpiryInFuture({ month: 2, year: 2027 }, now)).toBe(false);
    expect(isExpiryInFuture({ month: 1, year: 2028 }, now)).toBe(true);
    expect(isExpiryInFuture({ month: 12, year: 2026 }, now)).toBe(false);
  });
});

describe('newIdempotencyKey', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('matches the payment-service key pattern and differs per call', () => {
    // given / when
    const first = newIdempotencyKey();
    const second = newIdempotencyKey();
    // then
    expect(first).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(first.startsWith('pay_')).toBe(true);
    expect(first).not.toBe(second);
  });

  it('strips characters the service does not allow', () => {
    // given a randomUUID that returns disallowed characters
    vi.stubGlobal('crypto', { randomUUID: () => 'ab:cd ef+12.34' });
    // when / then
    expect(newIdempotencyKey()).toBe('pay_abcdef1234');
  });

  it('falls back to random bytes outside secure contexts', () => {
    // given a crypto object without randomUUID
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(171) });
    // when / then
    expect(newIdempotencyKey()).toBe(`pay_${'ab'.repeat(16)}`);
  });
});

describe('payment presentation', () => {
  it.each([
    ['CARD_DECLINED', /declined/],
    ['INSUFFICIENT_FUNDS', /insufficient funds/],
    ['THREE_DS_FAILED', /3-D Secure verification failed/],
    ['THREE_DS_EXPIRED', /expired/],
    ['PROVIDER_TIMEOUT', /did not respond in time/],
    ['ORDER_NOT_PAYABLE', /returned to your card/],
  ])('explains %s', (code, message) => {
    // given / when / then
    expect(describePaymentFailure(code, 'provider text')).toMatch(message);
  });

  it('falls back to the provider message, then to a generic one', () => {
    // given / when / then
    expect(describePaymentFailure('SOMETHING_NEW', 'Provider says no')).toBe('Provider says no');
    expect(describePaymentFailure(null, null)).toBe('The payment did not go through.');
  });

  it('knows which statuses are final and which mean money was captured', () => {
    // given / when / then
    expect(isFinalPaymentStatus('PROCESSING')).toBe(false);
    expect(isFinalPaymentStatus('REQUIRES_ACTION')).toBe(false);
    expect(isFinalPaymentStatus('CAPTURED')).toBe(true);
    expect(isFinalPaymentStatus('VOIDED')).toBe(true);
    expect(wasCaptured({ status: 'PARTIALLY_REFUNDED' })).toBe(true);
    expect(wasCaptured({ status: 'REFUNDED' })).toBe(true);
    expect(wasCaptured({ status: 'VOIDED' })).toBe(false);
    expect(wasCaptured({ status: 'FAILED' })).toBe(false);
  });

  it('formats money, cards and points', () => {
    // given / when / then
    expect(formatMoney(126, 'USD')).toBe('$126.00');
    expect(formatMoney(5, 'EUR')).toBe('€5.00');
    expect(formatMoney(5, 'NOT-A-CURRENCY')).toBe('5.00 NOT-A-CURRENCY');
    expect(describeCard({ cardBrand: 'VISA', cardLast4: '4242' })).toBe('Visa •••• 4242');
    expect(describeCard({ cardBrand: 'OTHER', cardLast4: '0002' })).toBe('Card •••• 0002');
    expect(formatPoints(12500)).toBe('12,500');
    expect(pointsValue(550)).toBe(5.5);
  });
});

describe('pointsError', () => {
  it('accepts whole hundreds up to the balance and ignores an empty field', () => {
    // given / when / then
    expect(pointsError('', 500)).toBeNull();
    expect(pointsError('500', 500)).toBeNull();
    expect(pointsError('100', 150)).toBeNull();
  });

  it.each([
    ['0', 1000, 'Enter a whole number of points.'],
    ['-100', 1000, 'Enter a whole number of points.'],
    ['150.5', 1000, 'Enter a whole number of points.'],
    ['150', 1000, 'Redeem points in multiples of 100.'],
    ['600', 550, 'You only have 550 points.'],
  ])('rejects %s with balance %d', (raw, balance, message) => {
    // given / when / then
    expect(pointsError(raw, balance)).toBe(message);
  });
});

describe('orderAmountDue', () => {
  it('uses amountDue when present, including zero, and the total otherwise', () => {
    // given / when / then
    expect(orderAmountDue({ amountDue: 12.5, totalAmount: 40 })).toBe(12.5);
    expect(orderAmountDue({ amountDue: 0, totalAmount: 40 })).toBe(0);
    expect(orderAmountDue({ amountDue: null, totalAmount: 40 })).toBe(40);
  });
});
