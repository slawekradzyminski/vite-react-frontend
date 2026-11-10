import { describe, expect, it } from 'vitest';
import { createCardSchema, toPaymentCard } from './payment';

const now = () => new Date(2027, 5, 10);
const valid = { number: '4242 4242 4242 4242', expiry: '06/27', cvc: '123', holderName: '  Jan Kowalski ' };

function errorsFor(values: Partial<typeof valid>) {
  const result = createCardSchema(now).safeParse({ ...valid, ...values });
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe('card schema', () => {
  it('accepts a valid card expiring this month', () => {
    // given / when
    const result = createCardSchema(now).safeParse(valid);
    // then
    expect(result.success).toBe(true);
  });

  it.each([
    [{ number: '' }, 'number', 'Card number is required'],
    [{ number: '4242 4242' }, 'number', 'Card number must have 12 to 19 digits'],
    [{ number: '4242 4242 4242 4241' }, 'number', 'Card number is not valid'],
    [{ expiry: '' }, 'expiry', 'Expiry date is required'],
    [{ expiry: '13/27' }, 'expiry', 'Use the MM/YY format'],
    [{ expiry: '05/27' }, 'expiry', 'This card has expired'],
    [{ cvc: '' }, 'cvc', 'CVC is required'],
    [{ cvc: '12' }, 'cvc', 'CVC must be 3 or 4 digits'],
    [{ cvc: '12a' }, 'cvc', 'CVC must be 3 or 4 digits'],
    [{ holderName: '   ' }, 'holderName', 'Name on card is required'],
    [{ holderName: 'x'.repeat(101) }, 'holderName', 'Name on card must be at most 100 characters'],
  ] as const)('reports %o on %s', (values, field, message) => {
    // given / when
    const errors = errorsFor(values) as Record<string, string[] | undefined>;
    // then
    expect(errors[field]).toEqual([message]);
  });

  it('reports only the length problem for a short number, not the checksum', () => {
    // given / when
    const errors = errorsFor({ number: '1234' });
    // then
    expect(errors.number).toEqual(['Card number must have 12 to 19 digits']);
  });

  it('accepts a four-digit CVC', () => {
    // given / when / then
    expect(errorsFor({ cvc: '1234' }).cvc).toBeUndefined();
  });
});

describe('toPaymentCard', () => {
  it('sends bare digits, numeric expiry and a trimmed holder name', () => {
    // given / when
    const card = toPaymentCard(valid);
    // then
    expect(card).toEqual({ number: '4242424242424242', expiryMonth: 6, expiryYear: 2027, cvc: '123', holderName: 'Jan Kowalski' });
  });

  it('refuses an unvalidated expiry', () => {
    // given / when / then
    expect(() => toPaymentCard({ ...valid, expiry: 'soon' })).toThrow('Expiry must be validated');
  });
});
