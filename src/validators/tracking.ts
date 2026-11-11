import { z } from 'zod';

// Carrier numbers are 10-24 letters and digits; the form only rejects input that cannot be one.
export const trackingLookupSchema = z.object({
  trackingNumber: z.string()
    .transform((value) => value.replace(/\s+/g, '').toUpperCase())
    .pipe(z.string()
      .min(1, 'Enter a tracking number')
      .max(40, 'Tracking numbers are at most 40 characters')
      .regex(/^[A-Z0-9]+$/, 'Use letters and digits only')),
});

export type TrackingLookupInput = z.input<typeof trackingLookupSchema>;
export type TrackingLookupForm = z.output<typeof trackingLookupSchema>;
