const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

type RuntimeEnv = {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
  VITE_DOCKER?: string;
  VITE_PASSWORD_RESET_BASE_URL?: string;
  VITE_SSO_ENABLED?: string;
  VITE_SSO_AUTHORITY?: string;
  VITE_SSO_CLIENT_ID?: string;
  VITE_SSO_REDIRECT_URI?: string;
  VITE_SSO_POST_LOGOUT_REDIRECT_URI?: string;
};

type RuntimeLocation = Pick<Location, 'origin'>;

export type SsoRuntimeConfig = {
  enabled: boolean;
  authority: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
};

const getRuntimeOrigin = (location: RuntimeLocation) => trimTrailingSlash(location.origin);
const isLocalTrainingGateway = (location: RuntimeLocation) => {
  const origin = getRuntimeOrigin(location);
  return origin === 'http://localhost:8081' || origin === 'http://127.0.0.1:8081';
};

export const getApiBaseUrl = (
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => {
  const configuredBaseUrl = env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  if (env.DEV) {
    const isDocker = env.VITE_DOCKER === 'true';
    const host = isDocker ? 'host.docker.internal' : 'localhost';
    return `http://${host}:4001`;
  }

  return getRuntimeOrigin(location);
};

export const getPasswordResetBaseUrl = (
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => {
  const configuredResetBaseUrl = env.VITE_PASSWORD_RESET_BASE_URL?.trim();
  if (configuredResetBaseUrl) {
    return trimTrailingSlash(configuredResetBaseUrl);
  }

  return `${getRuntimeOrigin(location)}/reset`;
};

export const getSsoConfig = (
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
): SsoRuntimeConfig | null => {
  const configuredEnabled = env.VITE_SSO_ENABLED?.trim().toLowerCase();
  const enabled = configuredEnabled
    ? configuredEnabled === 'true'
    : isLocalTrainingGateway(location);
  if (!enabled) {
    return null;
  }

  const origin = getRuntimeOrigin(location);
  const authority = env.VITE_SSO_AUTHORITY?.trim() || 'http://localhost:8082/realms/awesome-testing';
  const clientId = env.VITE_SSO_CLIENT_ID?.trim() || 'awesome-testing-frontend';
  const redirectUri = env.VITE_SSO_REDIRECT_URI?.trim() || `${origin}/auth/sso/callback`;
  const postLogoutRedirectUri = env.VITE_SSO_POST_LOGOUT_REDIRECT_URI?.trim() || `${origin}/login`;

  if (!authority || !clientId || !redirectUri || !postLogoutRedirectUri) {
    return null;
  }

  const resolveUrl = (value: string) => new URL(value, `${origin}/`).toString();

  return {
    enabled,
    authority: trimTrailingSlash(authority),
    clientId,
    redirectUri: resolveUrl(redirectUri),
    postLogoutRedirectUri: resolveUrl(postLogoutRedirectUri),
  };
};

export const getAbsoluteApiUrl = (
  path: string,
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => new URL(path, `${getApiBaseUrl(env, location)}/`).toString();
