const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

type RuntimeEnv = {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
  VITE_WAREHOUSE_API_BASE_URL?: string;
  VITE_PAYMENT_API_BASE_URL?: string;
  VITE_DOCKER?: string;
  VITE_WAREHOUSE_ENABLED?: string;
  VITE_PAYMENT_ENABLED?: string;
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

// Warehouse, returns and purchasing screens need warehouse-service, which every profile runs.
// A build without it sets VITE_WAREHOUSE_ENABLED=false to hide them and send no requests.
export const isWarehouseEnabled = (env: RuntimeEnv = import.meta.env) =>
  env.VITE_WAREHOUSE_ENABLED?.trim().toLowerCase() !== 'false';

// Card payment screens need payment-service, which every profile runs.
// A build without it sets VITE_PAYMENT_ENABLED=false to hide them and send no requests.
export const isPaymentEnabled = (env: RuntimeEnv = import.meta.env) =>
  env.VITE_PAYMENT_ENABLED?.trim().toLowerCase() !== 'false';

// Shipments, returns, suppliers, purchase orders and reorder suggestions are served by
// warehouse-service. Behind the gateway it shares the backend origin, so only direct-to-service
// development needs a separate origin.
export const getWarehouseApiBaseUrl = (
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => {
  const configuredBaseUrl = env.VITE_WAREHOUSE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  return getApiBaseUrl(env, location);
};

// Card payments are served by payment-service. Behind the gateway it shares the backend origin,
// so only direct-to-service development needs a separate origin.
export const getPaymentApiBaseUrl = (
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => {
  const configuredBaseUrl = env.VITE_PAYMENT_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  return getApiBaseUrl(env, location);
};

export const getAbsoluteApiUrl = (
  path: string,
  env: RuntimeEnv = import.meta.env,
  location: RuntimeLocation = window.location,
) => new URL(path, `${getApiBaseUrl(env, location)}/`).toString();
