import type { Payment, PaymentStatus } from '../types/payment';
import type { Order } from '../types/order';

/** Strips spaces and dashes, the separators people type or paste into card numbers. */
export function cardDigits(value: string) {
  return value.replace(/[\s-]/g, '');
}

/** Luhn checksum over a 12-19 digit card number (separators ignored). */
export function isLuhnValid(value: string) {
  const digits = cardDigits(value);
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** Groups the digits in fours ("4242 4242 4242 4242") and caps the length at 19 digits. */
export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Normalises typed expiry input to MM/YY, inserting the slash after the month. */
export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export type Expiry = { month: number; year: number };

/** Parses MM/YY into a month and four-digit year; returns null for anything else. */
export function parseExpiry(value: string): Expiry | null {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(match[2]) };
}

/** A card stays valid until the end of its expiry month. */
export function isExpiryInFuture({ month, year }: Expiry, now: Date = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

const IDEMPOTENCY_KEY_ALLOWED = /[^A-Za-z0-9_-]/g;

/** A fresh Idempotency-Key matching payment-service's `^[A-Za-z0-9_-]{8,64}$`. */
export function newIdempotencyKey() {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `pay_${random.replace(IDEMPOTENCY_KEY_ALLOWED, '')}`.slice(0, 64);
}

export type TestCard = { number: string; label: string; outcome: string };

/** The simulated provider's test cards (payment-service contract). */
export const TEST_CARDS: TestCard[] = [
  { number: '4242 4242 4242 4242', label: 'Visa', outcome: 'Captured immediately' },
  { number: '5555 5555 5555 4444', label: 'Mastercard', outcome: 'Captured immediately' },
  { number: '4000 0000 0000 0002', label: 'Declined', outcome: 'Fails: card declined' },
  { number: '4000 0000 0000 9995', label: 'Insufficient funds', outcome: 'Fails: insufficient funds' },
  { number: '4000 0000 0000 3220', label: '3-D Secure', outcome: 'Needs code 123456' },
  { number: '4000 0000 0000 0077', label: 'Async success', outcome: 'Processing, then captured' },
  { number: '4000 0000 0000 0119', label: 'Async timeout', outcome: 'Processing, then provider timeout' },
  { number: '4000 0000 0000 0259', label: 'Duplicate notification', outcome: 'Captured, result delivered twice' },
];

const FAILURE_MESSAGES: Record<string, string> = {
  CARD_DECLINED: 'Your card was declined. Try another card.',
  INSUFFICIENT_FUNDS: 'The card has insufficient funds. Try another card.',
  THREE_DS_FAILED: '3-D Secure verification failed. The code was not accepted.',
  THREE_DS_EXPIRED: 'The 3-D Secure verification expired before it was completed.',
  PROVIDER_TIMEOUT: 'The card provider did not respond in time. Your card was not charged.',
  ORDER_NOT_PAYABLE: 'The order could not take this payment, so it was returned to your card.',
};

/** A friendly explanation for a failed payment, falling back to the provider's text. */
export function describePaymentFailure(failureCode?: string | null, failureMessage?: string | null) {
  return (failureCode && FAILURE_MESSAGES[failureCode]) || failureMessage || 'The payment did not go through.';
}

const FINAL_STATUSES: PaymentStatus[] = ['CAPTURED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOIDED'];

export function isFinalPaymentStatus(status: PaymentStatus) {
  return FINAL_STATUSES.includes(status);
}

/** Captured money stays captured when part or all of it is later refunded. */
export function wasCaptured(payment: Pick<Payment, 'status'>) {
  return payment.status === 'CAPTURED' || payment.status === 'PARTIALLY_REFUNDED' || payment.status === 'REFUNDED';
}

export function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const BRAND_LABELS: Record<string, string> = { VISA: 'Visa', MASTERCARD: 'Mastercard', AMEX: 'American Express', OTHER: 'Card' };

export function describeCard(payment: Pick<Payment, 'cardBrand' | 'cardLast4'>) {
  return `${BRAND_LABELS[payment.cardBrand] ?? 'Card'} •••• ${payment.cardLast4}`;
}

/** 100 loyalty points are worth 1.00 at checkout. */
export const POINTS_PER_UNIT = 100;

export function pointsValue(points: number) {
  return points / POINTS_PER_UNIT;
}

export function formatPoints(points: number) {
  return new Intl.NumberFormat('en-US').format(points);
}

/** Validates a points amount typed by the customer against the redeemable balance. */
export function pointsError(raw: string, balance: number): string | null {
  if (!raw.trim()) return null;
  const points = Number(raw);
  if (!Number.isInteger(points) || points <= 0) return 'Enter a whole number of points.';
  if (points % POINTS_PER_UNIT !== 0) return `Redeem points in multiples of ${POINTS_PER_UNIT}.`;
  if (points > balance) return `You only have ${formatPoints(balance)} points.`;
  return null;
}

/** What is left to pay by card after gift card and points; older backends omit amountDue. */
export function orderAmountDue(order: Pick<Order, 'amountDue' | 'totalAmount'>) {
  return order.amountDue ?? order.totalAmount;
}
