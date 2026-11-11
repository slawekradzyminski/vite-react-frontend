import { z } from 'zod';

const decimalPlaces = (value: string) => (value.includes('.') ? value.split('.')[1].length : 0);
const numeric = /^\d+(\.\d+)?$/;

// VatRateRequestDto: rate 0-50 with at most two decimals, country name 1-64 characters.
export const vatRateSchema = z.object({
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/, 'Use a 2-letter ISO country code'),
  countryName: z.string().trim().min(1, 'Country name is required').max(64, 'Country name must be at most 64 characters'),
  rate: z.string()
    .trim()
    .min(1, 'Rate is required')
    .refine((value) => !value || numeric.test(value), 'Rate must be a number')
    .refine((value) => !numeric.test(value) || Number(value) <= 50, 'Rate must be between 0 and 50')
    .refine((value) => !numeric.test(value) || decimalPlaces(value) <= 2, 'Use at most 2 decimal places'),
});

export type VatRateFormData = z.infer<typeof vatRateSchema>;

// CurrencyRequestDto: rate above 0 with at most six decimals, USD stays the base at 1.
export const currencySchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z]{3}$/, 'Use a 3-letter ISO currency code'),
  name: z.string().trim().min(1, 'Name is required').max(64, 'Name must be at most 64 characters'),
  symbol: z.string().trim().min(1, 'Symbol is required').max(8, 'Symbol must be at most 8 characters'),
  rateToUsd: z.string()
    .trim()
    .min(1, 'Rate is required')
    .refine((value) => !value || numeric.test(value), 'Rate must be a number')
    .refine((value) => !numeric.test(value) || (Number(value) > 0 && Number(value) <= 999999.999999), 'Rate must be above 0 and at most 999999.999999')
    .refine((value) => !numeric.test(value) || decimalPlaces(value) <= 6, 'Use at most 6 decimal places'),
}).refine((form) => form.code.trim().toUpperCase() !== 'USD' || Number(form.rateToUsd) === 1, {
  message: 'USD is the base currency and its rate must stay 1',
  path: ['rateToUsd'],
});

export type CurrencyFormData = z.infer<typeof currencySchema>;

// GiftCardCreateDto: amount 1-1000 with at most two decimals; expiry must be in the future.
export const giftCardSchema = z.object({
  amount: z.string()
    .trim()
    .min(1, 'Amount is required')
    .refine((value) => !value || numeric.test(value), 'Amount must be a number')
    .refine((value) => !numeric.test(value) || (Number(value) >= 1 && Number(value) <= 1000), 'Amount must be between 1 and 1000')
    .refine((value) => !numeric.test(value) || decimalPlaces(value) <= 2, 'Use at most 2 decimal places'),
  recipientUsername: z.string().trim().max(255, 'Username must be at most 255 characters'),
  note: z.string().trim().max(255, 'Note must be at most 255 characters'),
  expiresAt: z.string().refine((value) => !value || new Date(value).getTime() > Date.now(), 'Expiry must be in the future'),
});

export type GiftCardFormData = z.infer<typeof giftCardSchema>;
