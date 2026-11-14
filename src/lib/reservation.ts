import type { Order } from '../types/order';

type ReservationFields = Pick<Order, 'status' | 'reservationExpiresAt' | 'updatedAt'>;

/** How often the order is reloaded after the countdown reached zero but the backend has not expired it yet. */
export const RESERVATION_EXPIRY_POLL_MS = 5000;

// The backend sends updatedAt as a LocalDateTime without an offset, in UTC (the services run in
// UTC); Date.parse would read such a value as browser-local time.
const HAS_OFFSET = /(Z|[+-]\d\d:?\d\d)$/i;

const parseInstant = (value?: string | null) => {
  if (!value) return null;
  const time = Date.parse(value.includes('T') && !HAS_OFFSET.test(value) ? `${value}Z` : value);
  return Number.isNaN(time) ? null : time;
};

/** The end of the stock hold of a PENDING order in epoch milliseconds; null when it has none. */
export function reservationDeadline(order: ReservationFields): number | null {
  return order.status === 'PENDING' ? parseInstant(order.reservationExpiresAt) : null;
}

/**
 * Whether a cancelled order was cancelled because its reservation ran out. The order carries no
 * cancellation reason, but the expiry job and the admin time control both cancel at or after the
 * stored end, while a customer or admin cancellation of a live reservation happens before it.
 */
export function reservationExpired(order: ReservationFields): boolean {
  if (order.status !== 'CANCELLED') return false;
  const deadline = parseInstant(order.reservationExpiresAt);
  const cancelledAt = parseInstant(order.updatedAt);
  return deadline !== null && cancelledAt !== null && deadline <= cancelledAt;
}

/** Milliseconds left until the deadline, never negative. */
export function remainingMs(deadline: number, now: number): number {
  return Math.max(0, deadline - now);
}

/** `m:ss` below an hour, `h:mm:ss` above; partial seconds round up so 0:00 means the hold is over. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}` : `${minutes}:${ss}`;
}

/** Local wall-clock time of the deadline as HH:MM (24-hour). */
export function formatReservedUntil(deadline: number): string {
  const date = new Date(deadline);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
