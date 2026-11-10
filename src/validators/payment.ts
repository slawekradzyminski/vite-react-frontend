import { z } from 'zod';
import { cardDigits, isExpiryInFuture, isLuhnValid, parseExpiry, type Expiry } from '../lib/payment';
import type { PaymentCard } from '../types/payment';

/** Card form schema; `now` is injectable so expiry checks are deterministic in tests. */
export function createCardSchema(now: () => Date = () => new Date()) {
  return z.object({
    number: z.string()
      .min(1, { message: 'Card number is required', abort: true })
      .refine((value) => /^\d{12,19}$/.test(cardDigits(value)), { message: 'Card number must have 12 to 19 digits', abort: true })
      .refine(isLuhnValid, 'Card number is not valid'),
    expiry: z.string()
      .min(1, { message: 'Expiry date is required', abort: true })
      .refine((value) => parseExpiry(value) !== null, { message: 'Use the MM/YY format', abort: true })
      .refine((value) => isExpiryInFuture(parseExpiry(value) as Expiry, now()), 'This card has expired'),
    cvc: z.string()
      .min(1, { message: 'CVC is required', abort: true })
      .regex(/^\d{3,4}$/, 'CVC must be 3 or 4 digits'),
    holderName: z.string()
      .trim()
      .min(1, { message: 'Name on card is required', abort: true })
      .max(100, 'Name on card must be at most 100 characters'),
  });
}

export type CardFormValues = z.input<ReturnType<typeof createCardSchema>>;

/** Converts validated form values into the payment-service card body. */
export function toPaymentCard(values: CardFormValues): PaymentCard {
  const expiry = parseExpiry(values.expiry);
  if (!expiry) throw new Error('Expiry must be validated before submitting');
  return {
    number: cardDigits(values.number),
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
    cvc: values.cvc,
    holderName: values.holderName.trim(),
  };
}
