export type LoginNavigate = (url: string) => void;

export function navigateAfterLogin(
  returnTo: string,
  navigate: LoginNavigate,
  documentNavigate: (url: string) => void = (url) => window.location.assign(url),
) {
  if (returnTo === '/learn' || returnTo.startsWith('/learn/')) {
    documentNavigate(returnTo);
    return;
  }

  navigate(returnTo);
}
