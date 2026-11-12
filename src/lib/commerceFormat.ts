export const selectClassName = 'h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white';

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Parses a backend timestamp that is UTC wall time without an offset (for example a gift card's `expiresAt`).
 * The backend drops a trailing `Z` when it reads such a field, so the UI sends and reads these values as UTC.
 */
export function parseUtcDateTime(value: string): Date {
  return new Date(HAS_ZONE.test(value) ? value : `${value}Z`);
}

export function formatUtcDateTime(value?: string | null) {
  return value ? parseUtcDateTime(value).toLocaleString() : '—';
}

export function formatUtcDate(value?: string | null) {
  return value ? parseUtcDateTime(value).toLocaleDateString() : '—';
}

/** Converts a `datetime-local` input value, which is wall time in the browser's zone, to a UTC instant (`...Z`). */
export function localInputToUtcIso(value: string): string {
  return new Date(value).toISOString();
}
