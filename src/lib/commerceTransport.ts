export type CommerceTransport = 'rest' | 'graphql';
export const COMMERCE_TRANSPORT_KEY = 'commerceTransport';

export function readCommerceTransport(): CommerceTransport {
  try {
    return window.sessionStorage.getItem(COMMERCE_TRANSPORT_KEY) === 'graphql' ? 'graphql' : 'rest';
  } catch {
    return 'rest';
  }
}

// A tab uses one transport for its lifetime. Switching reloads it and discards caches.
export const commerceTransport = readCommerceTransport();

export function changeCommerceTransport(transport: CommerceTransport, pendingMutations: number): boolean {
  if (pendingMutations > 0 || transport === commerceTransport) return false;
  window.sessionStorage.setItem(COMMERCE_TRANSPORT_KEY, transport);
  window.location.reload();
  return true;
}
