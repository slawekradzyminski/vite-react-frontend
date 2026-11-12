import { useSyncExternalStore } from 'react';

// Shop writes that do not run through React Query's useMutation (cart calls made straight from
// components and WebMCP tools) still count as pending here, so the Shop API selector cannot reload
// the tab under a write that is in flight.
let pending = 0;
const listeners = new Set<() => void>();

function setPending(delta: number) {
  pending += delta;
  listeners.forEach((listener) => listener());
}

export function trackWrite<T>(write: () => Promise<T>): Promise<T> {
  setPending(1);
  let result: Promise<T>;
  try {
    result = write();
  } catch (error) {
    setPending(-1);
    throw error;
  }
  return result.finally(() => setPending(-1));
}

/** Returns `target` with the named async methods counted as pending writes while they run. */
export function withTrackedWrites<T extends object, K extends keyof T>(target: T, methods: readonly K[]): T {
  const tracked = { ...target };
  for (const method of methods) {
    const original = target[method];
    if (typeof original !== 'function') continue;
    tracked[method] = ((...args: unknown[]) => trackWrite(() => original.apply(target, args))) as T[K];
  }
  return tracked;
}

export function pendingWriteCount() {
  return pending;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePendingWrites() {
  return useSyncExternalStore(subscribe, pendingWriteCount, pendingWriteCount);
}
