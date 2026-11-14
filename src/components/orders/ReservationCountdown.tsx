import { useEffect, useRef, useState } from 'react';
import type { Order } from '../../types/order';
import {
  RESERVATION_EXPIRY_POLL_MS,
  formatCountdown,
  formatReservedUntil,
  remainingMs,
  reservationDeadline,
  reservationExpired,
} from '../../lib/reservation';

interface ReservationCountdownProps {
  order: Pick<Order, 'status' | 'reservationExpiresAt' | 'updatedAt'>;
  /** Reloads the order. Called when the countdown reaches zero and then every few seconds until the backend cancels it. */
  onDeadline: () => void;
}

/**
 * "Reserved until HH:MM" with a live countdown for a PENDING order whose stock is held, and
 * "Reservation expired" once the backend cancelled it because the hold ran out.
 */
export function ReservationCountdown({ order, onDeadline }: ReservationCountdownProps) {
  const deadline = reservationDeadline(order);
  const [now, setNow] = useState(() => Date.now());
  const onDeadlineRef = useRef(onDeadline);

  useEffect(() => {
    onDeadlineRef.current = onDeadline;
  }, [onDeadline]);

  useEffect(() => {
    if (deadline === null) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const left = deadline === null ? null : remainingMs(deadline, now);
  const over = left === 0;

  // The expiry job runs every few seconds, so the first reload can still find the order PENDING.
  useEffect(() => {
    if (!over) return undefined;
    onDeadlineRef.current();
    const timer = window.setInterval(() => onDeadlineRef.current(), RESERVATION_EXPIRY_POLL_MS);
    return () => window.clearInterval(timer);
  }, [over]);

  if (reservationExpired(order)) {
    return (
      <p
        className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        role="status"
        data-testid="reservation-expired"
      >
        Reservation expired. The order was not paid in time, so it was cancelled and its items went back into stock.
      </p>
    );
  }

  if (deadline === null || left === null) return null;

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="timer"
      aria-live="off"
      data-testid="reservation-countdown"
    >
      <span data-testid="reservation-countdown-until">Reserved until {formatReservedUntil(deadline)}</span>
      <span className="font-semibold tabular-nums" data-testid="reservation-countdown-remaining">
        {over ? 'Reservation ending…' : `${formatCountdown(left)} left to pay`}
      </span>
    </div>
  );
}
