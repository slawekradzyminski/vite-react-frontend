import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ReservationCountdown } from './ReservationCountdown';

const NOW = new Date(2026, 10, 14, 10, 0, 0).getTime();
const inSeconds = (seconds: number) => new Date(NOW + seconds * 1000).toISOString();

describe('ReservationCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the deadline and counts down every second', () => {
    const onDeadline = vi.fn();
    render(<ReservationCountdown order={{ status: 'PENDING', reservationExpiresAt: inSeconds(90), updatedAt: '' }} onDeadline={onDeadline} />);

    expect(screen.getByTestId('reservation-countdown-until')).toHaveTextContent('Reserved until 10:01');
    expect(screen.getByTestId('reservation-countdown-remaining')).toHaveTextContent('1:30 left to pay');

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId('reservation-countdown-remaining')).toHaveTextContent('1:29 left to pay');
    expect(onDeadline).not.toHaveBeenCalled();
  });

  it('reloads the order at zero and keeps reloading until the backend cancels it', () => {
    const onDeadline = vi.fn();
    render(<ReservationCountdown order={{ status: 'PENDING', reservationExpiresAt: inSeconds(2), updatedAt: '' }} onDeadline={onDeadline} />);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onDeadline).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onDeadline).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('reservation-countdown-remaining')).toHaveTextContent('Reservation ending…');

    act(() => { vi.advanceTimersByTime(4999); });
    expect(onDeadline).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(1); });
    expect(onDeadline).toHaveBeenCalledTimes(2);
  });

  it('calls the latest reload callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const order = { status: 'PENDING' as const, reservationExpiresAt: inSeconds(1), updatedAt: '' };
    const { rerender } = render(<ReservationCountdown order={order} onDeadline={first} />);
    rerender(<ReservationCountdown order={order} onDeadline={second} />);

    act(() => { vi.advanceTimersByTime(1000); });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops polling once the order is cancelled and says the reservation expired', () => {
    const onDeadline = vi.fn();
    const deadline = inSeconds(-1);
    const { rerender } = render(<ReservationCountdown order={{ status: 'PENDING', reservationExpiresAt: deadline, updatedAt: '' }} onDeadline={onDeadline} />);
    expect(onDeadline).toHaveBeenCalledTimes(1);

    rerender(<ReservationCountdown order={{ status: 'CANCELLED', reservationExpiresAt: deadline, updatedAt: inSeconds(3) }} onDeadline={onDeadline} />);
    act(() => { vi.advanceTimersByTime(20_000); });

    expect(onDeadline).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('reservation-expired')).toHaveTextContent('Reservation expired');
    expect(screen.queryByTestId('reservation-countdown')).not.toBeInTheDocument();
  });

  it('renders nothing for orders without a reservation or cancelled before it ended', () => {
    const { container, rerender } = render(<ReservationCountdown order={{ status: 'PENDING', updatedAt: '' }} onDeadline={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ReservationCountdown order={{ status: 'PAID', reservationExpiresAt: inSeconds(60), updatedAt: '' }} onDeadline={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ReservationCountdown order={{ status: 'CANCELLED', reservationExpiresAt: inSeconds(60), updatedAt: inSeconds(0) }} onDeadline={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
