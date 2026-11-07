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
