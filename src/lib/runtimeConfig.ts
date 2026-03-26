const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

type RuntimeEnv = {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
  VITE_DOCKER?: string;
  VITE_PASSWORD_RESET_BASE_URL?: string;
};

type RuntimeLocation = Pick<Location, 'origin'>;

const getRuntimeOrigin = (location: RuntimeLocation) => trimTrailingSlash(location.origin);

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

export const getAbsoluteApiUrl = (
  path: string,
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => new URL(path, `${getApiBaseUrl(env, location)}/`).toString();

