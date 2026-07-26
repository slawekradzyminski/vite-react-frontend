export type LoginNavigate = (url: string) => void;

export function navigateAfterLogin(
  returnTo: string,
  navigate: LoginNavigate,
) {
  navigate(returnTo);
}
