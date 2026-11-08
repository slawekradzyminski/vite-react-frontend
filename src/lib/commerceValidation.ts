import { CARRIER_FORMATS, type Carrier, type CouponType, type ReviewRequest } from '../types/commerce';

// Client-side mirrors of the backend rules, so forms explain problems before a round trip.

export function validateReview(form: ReviewRequest) {
  const errors: Partial<Record<keyof ReviewRequest, string>> = {};
  if (!form.rating || form.rating < 1 || form.rating > 5) errors.rating = 'Choose a rating from 1 to 5.';
  const title = form.title.trim();
  if (title.length < 3 || title.length > 120) errors.title = 'Title must be between 3 and 120 characters.';
  const body = form.body.trim();
  if (body.length < 10 || body.length > 2000) errors.body = 'Review must be between 10 and 2000 characters.';
  return errors;
}

export function validateWeight(value: string) {
  const weight = Number(value);
  if (!value.trim() || Number.isNaN(weight)) return 'Enter the package weight.';
  if (weight < 0.01 || weight > 30) return 'Weight must be between 0.01 and 30.00 kg.';
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return 'Use at most two decimals.';
  return null;
}

export function validateTracking(carrier: Carrier, value: string) {
  const normalized = value.trim().toUpperCase();
  return CARRIER_FORMATS[carrier].pattern.test(normalized) ? null : `${carrier} tracking numbers are ${CARRIER_FORMATS[carrier].hint}.`;
}

export interface CouponForm {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  validFrom: string;
  validUntil: string;
  maxRedemptions: string;
  perUserLimit: string;
  active: boolean;
}

export function validateCouponForm(form: CouponForm) {
  const errors: Partial<Record<keyof CouponForm, string>> = {};
  if (!/^[A-Za-z0-9-]{3,32}$/.test(form.code.trim())) errors.code = 'Use 3-32 letters, digits or hyphens.';
  const value = Number(form.value);
  if (!form.value || Number.isNaN(value) || value <= 0) errors.value = 'Enter a positive value.';
  else if (form.type === 'PERCENTAGE' && value > 100) errors.value = 'Percentage cannot exceed 100.';
  if (form.minOrderAmount && (Number.isNaN(Number(form.minOrderAmount)) || Number(form.minOrderAmount) < 0)) errors.minOrderAmount = 'Minimum cannot be negative.';
  if (form.validFrom && form.validUntil && form.validUntil <= form.validFrom) errors.validUntil = 'End must be after start.';
  if (form.maxRedemptions && (!Number.isInteger(Number(form.maxRedemptions)) || Number(form.maxRedemptions) < 1)) errors.maxRedemptions = 'Use a whole number of at least 1.';
  if (!Number.isInteger(Number(form.perUserLimit)) || Number(form.perUserLimit) < 1) errors.perUserLimit = 'Use a whole number of at least 1.';
  return errors;
}
