import { describe, expect, it } from 'vitest';
import {
  RESERVATION_EXPIRY_POLL_MS,
  formatCountdown,
  formatReservedUntil,
  remainingMs,
  reservationDeadline,
  reservationExpired,
} from './reservation';

const EXPIRES = '2026-11-14T10:30:00.000Z';

describe('reservation', () => {
  describe('reservationDeadline', () => {
    it('reads the end of the hold of a PENDING order', () => {
      expect(reservationDeadline({ status: 'PENDING', reservationExpiresAt: EXPIRES, updatedAt: '' })).toBe(Date.parse(EXPIRES));
    });

    it('has none for orders without a reservation or an unparsable one', () => {
      expect(reservationDeadline({ status: 'PENDING', updatedAt: '' })).toBeNull();
      expect(reservationDeadline({ status: 'PENDING', reservationExpiresAt: null, updatedAt: '' })).toBeNull();
      expect(reservationDeadline({ status: 'PENDING', reservationExpiresAt: 'soon', updatedAt: '' })).toBeNull();
    });

    it('has none once the order left PENDING', () => {
      for (const status of ['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const) {
        expect(reservationDeadline({ status, reservationExpiresAt: EXPIRES, updatedAt: '' })).toBeNull();
      }
    });
  });

  describe('reservationExpired', () => {
    it('recognises an order cancelled at or after the end of its reservation', () => {
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: EXPIRES })).toBe(true);
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T10:30:12.345Z' })).toBe(true);
    });

    it('reads the backend\'s offset-less updatedAt as UTC whatever the browser time zone', () => {
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T10:30:00.123456' })).toBe(true);
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T10:29:59.5' })).toBe(false);
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T11:30:00+01:00' })).toBe(true);
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T11:29:00+0100' })).toBe(false);
    });

    it('does not mistake a cancellation before the deadline for an expiry', () => {
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T10:29:59.999Z' })).toBe(false);
    });

    it('needs a cancelled order with a reservation and a parsable timestamp', () => {
      expect(reservationExpired({ status: 'PENDING', reservationExpiresAt: EXPIRES, updatedAt: '2026-11-14T11:00:00Z' })).toBe(false);
      expect(reservationExpired({ status: 'CANCELLED', updatedAt: '2026-11-14T11:00:00Z' })).toBe(false);
      expect(reservationExpired({ status: 'CANCELLED', reservationExpiresAt: EXPIRES, updatedAt: '' })).toBe(false);
    });
  });

  it('never reports negative time left', () => {
    expect(remainingMs(10_000, 4_000)).toBe(6_000);
    expect(remainingMs(10_000, 10_000)).toBe(0);
    expect(remainingMs(10_000, 12_000)).toBe(0);
  });

  it.each([
    [0, '0:00'],
    [-5, '0:00'],
    [1, '0:01'],
    [999, '0:01'],
    [1000, '0:01'],
    [1001, '0:02'],
    [59_000, '0:59'],
    [60_000, '1:00'],
    [29 * 60_000 + 5_000, '29:05'],
    [3_600_000, '1:00:00'],
    [3_600_000 + 61_000, '1:01:01'],
  ])('formats %i ms as %s', (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });

  it('shows the deadline as local HH:MM', () => {
    const deadline = new Date(2026, 10, 14, 9, 5, 59).getTime();
    expect(formatReservedUntil(deadline)).toBe('09:05');
    expect(formatReservedUntil(new Date(2026, 10, 14, 23, 45).getTime())).toBe('23:45');
  });

  it('polls a lapsed reservation every five seconds', () => {
    expect(RESERVATION_EXPIRY_POLL_MS).toBe(5000);
  });
});
