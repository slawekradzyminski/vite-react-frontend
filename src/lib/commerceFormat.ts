export const selectClassName = 'h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white';

// An ISO date-time without an offset, as backend and payment-service send their LocalDateTime
// fields ("2026-11-24T19:30:50.189678"). Those values are UTC wall time (the services run in UTC),
// but the Date constructor would read them as browser-local time and show them an hour off in CET.
const NAIVE_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/**
 * Parses a backend timestamp. A value with `Z` or an offset (notification-service, webhooks) is
 * read as is; an ISO date-time without one is read as UTC. Every date the UI renders goes through
 * this function or one of the formatters below.
 */
export function parseUtcDateTime(value: string): Date {
  return new Date(NAIVE_DATE_TIME.test(value) ? `${value}Z` : value);
}

function parseValid(value?: string | null): Date | null {
  if (!value) return null;
  const date = parseUtcDateTime(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date and time in the browser's zone and locale; '—' for a missing or unparsable value. */
export function formatDateTime(value?: string | null) {
  return parseValid(value)?.toLocaleString() ?? '—';
}

/** Date in the browser's zone and locale; '—' for a missing or unparsable value. */
export function formatDate(value?: string | null) {
  return parseValid(value)?.toLocaleDateString() ?? '—';
}

/** Time of day in the browser's zone and locale; '—' for a missing or unparsable value. */
export function formatTime(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  return parseValid(value)?.toLocaleTimeString([], options) ?? '—';
}

/** Converts a `datetime-local` input value, which is wall time in the browser's zone, to a UTC instant (`...Z`). */
export function localInputToUtcIso(value: string): string {
  return new Date(value).toISOString();
}

/** The inverse of `localInputToUtcIso`: a backend UTC value as a `datetime-local` value in the browser's zone. */
export function utcToLocalInput(value?: string | null): string {
  if (!value) return '';
  const date = parseUtcDateTime(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
