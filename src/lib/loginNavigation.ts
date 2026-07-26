export type LoginNavigate = (url: string) => void;

export function sanitizeReturnTo(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  try {
    const parsed = new URL(value, 'https://same-origin.invalid');
    if (parsed.origin !== 'https://same-origin.invalid') {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function readLoginReturnTo(search: string, fallback = '/') {
  return sanitizeReturnTo(new URLSearchParams(search).get('returnTo'), fallback);
}

export function navigateAfterLogin(
  returnTo: string,
  navigate: LoginNavigate,
) {
  navigate(returnTo);
}
