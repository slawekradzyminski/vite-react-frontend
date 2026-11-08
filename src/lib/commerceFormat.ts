export const selectClassName = 'h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white';

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}
