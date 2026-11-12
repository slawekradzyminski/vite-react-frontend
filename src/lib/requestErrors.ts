import axios from 'axios';

export function responseStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function isClientError(error: unknown) {
  const status = responseStatus(error);
  return status !== undefined && status >= 400 && status < 500;
}

// Retrying a 4xx only delays the error the user will see anyway (BUG-006).
export function retryServerErrors(failureCount: number, error: unknown) {
  return !isClientError(error) && failureCount < 3;
}

export function describeCartError(error: unknown, fallback: string) {
  switch (responseStatus(error)) {
    case 409:
      return 'Not enough stock for the requested quantity.';
    case 404:
      return 'This product is no longer available.';
    default:
      return fallback;
  }
}

// Prefers the backend's explanation: ErrorDto.message, then the first field
// validation message, then {"error": "..."} maps.
export function serverMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data: unknown = error.response?.data;
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  const firstText = Object.values(record).find((value): value is string => typeof value === 'string' && value.trim() !== '');
  return firstText ?? fallback;
}

// A 400 body that maps field names to messages ({"description": "Product description is required"}),
// as the backend's validation handler sends it; anything else yields no field errors.
export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return {};
  const data: unknown = error.response.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>)
      .filter((entry): entry is [string, string] => entry[0] !== 'message' && typeof entry[1] === 'string' && entry[1].trim() !== ''),
  );
}
