import { auth } from './api';
import { authStorage } from './authStorage';
import { getSsoConfig } from './runtimeConfig';
import type { LoginResponse } from '../types/auth';

const SSO_STATE_KEY = 'ssoState';
const SSO_NONCE_KEY = 'ssoNonce';
const SSO_CODE_VERIFIER_KEY = 'ssoCodeVerifier';

type SsoEnv = Parameters<typeof getSsoConfig>[0];
type RuntimeLocation = Parameters<typeof getSsoConfig>[1];

let callbackCompletion: { key: string; promise: Promise<LoginResponse> } | null = null;

const isBrowser = () => typeof window !== 'undefined';

const getSessionStorage = () => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const safeGetItem = (key: string) => {
  const storage = getSessionStorage();
  return storage ? storage.getItem(key) : null;
};

const safeSetItem = (key: string, value: string) => {
  const storage = getSessionStorage();
  storage?.setItem(key, value);
};

const safeRemoveItem = (key: string) => {
  const storage = getSessionStorage();
  storage?.removeItem(key);
};

const randomValue = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
};

const createCodeChallenge = async (verifier: string) => base64UrlEncode(await sha256(verifier));

const buildQueryString = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  return searchParams.toString();
};

const createSsoUrl = (baseUrl: string, params: Record<string, string | undefined>) => {
  const url = new URL(baseUrl);
  const query = buildQueryString(params);
  if (query) {
    url.search = query;
  }
  return url.toString();
};

const completeCallbackOnce = async (
  callbackUrl: string,
  idTokenExchange: typeof auth.ssoExchange,
  env: SsoEnv,
  location: RuntimeLocation,
): Promise<LoginResponse> => {
  const config = getSsoConfig(env, location);
  if (!config) {
    throw new Error('SSO is not configured');
  }

  const url = new URL(callbackUrl, window.location.origin);
  const params = new URLSearchParams(url.search);
  const error = params.get('error');
  if (error) {
    const errorDescription = params.get('error_description');
    throw new Error(errorDescription ? `${error}: ${errorDescription}` : error);
  }

  const code = params.get('code');
  if (!code) {
    throw new Error('Missing SSO authorization code');
  }

  const expectedState = safeGetItem(SSO_STATE_KEY);
  const returnedState = params.get('state');
  if (expectedState && returnedState !== expectedState) {
    throw new Error('SSO state mismatch');
  }

  const codeVerifier = safeGetItem(SSO_CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('Missing SSO code verifier');
  }

  const tokenResponse = await fetch(`${config.authority}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange SSO authorization code');
  }

  const tokenBody = await tokenResponse.json() as { id_token?: string };
  if (!tokenBody.id_token) {
    throw new Error('Missing SSO id token');
  }

  safeRemoveItem(SSO_STATE_KEY);
  safeRemoveItem(SSO_NONCE_KEY);
  safeRemoveItem(SSO_CODE_VERIFIER_KEY);

  const response = await idTokenExchange({ idToken: tokenBody.id_token });
  return response.data;
};

export const sso = {
  isEnabled: (env: SsoEnv = import.meta.env, location: RuntimeLocation = window.location) =>
    Boolean(getSsoConfig(env, location)),

  beginLogin: async (env: SsoEnv = import.meta.env, location: RuntimeLocation = window.location) => {
    const config = getSsoConfig(env, location);
    if (!config) {
      throw new Error('SSO is not configured');
    }

    const state = randomValue();
    const nonce = randomValue();
    const codeVerifier = `${randomValue()}-${randomValue()}`;
    const codeChallenge = await createCodeChallenge(codeVerifier);
    safeSetItem(SSO_STATE_KEY, state);
    safeSetItem(SSO_NONCE_KEY, nonce);
    safeSetItem(SSO_CODE_VERIFIER_KEY, codeVerifier);

    const authorizationUrl = createSsoUrl(
      `${config.authority}/protocol/openid-connect/auth`,
      {
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        prompt: 'login',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      },
    );

    window.location.assign(authorizationUrl);
  },

  beginSocialLogin: async (
    provider: 'google' | 'github',
    env: SsoEnv = import.meta.env,
    location: RuntimeLocation = window.location,
  ) => {
    const config = getSsoConfig(env, location);
    if (!config) {
      throw new Error('SSO is not configured');
    }

    const state = randomValue();
    const nonce = randomValue();
    const codeVerifier = `${randomValue()}-${randomValue()}`;
    const codeChallenge = await createCodeChallenge(codeVerifier);
    safeSetItem(SSO_STATE_KEY, state);
    safeSetItem(SSO_NONCE_KEY, nonce);
    safeSetItem(SSO_CODE_VERIFIER_KEY, codeVerifier);

    const authorizationUrl = createSsoUrl(
      `${config.authority}/protocol/openid-connect/auth`,
      {
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        prompt: 'login',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        kc_idp_hint: provider,
      },
    );

    window.location.assign(authorizationUrl);
  },

  beginLogout: (env: SsoEnv = import.meta.env, location: RuntimeLocation = window.location) => {
    const config = getSsoConfig(env, location);
    authStorage.clearTokens();

    if (!config) {
      window.location.assign('/login');
      return;
    }

    const logoutUrl = createSsoUrl(
      `${config.authority}/protocol/openid-connect/logout`,
      {
        client_id: config.clientId,
        post_logout_redirect_uri: config.postLogoutRedirectUri,
      },
    );

    window.location.assign(logoutUrl);
  },

  completeCallback: async (
    callbackUrl: string = window.location.href,
    idTokenExchange = auth.ssoExchange,
    env: SsoEnv = import.meta.env,
    location: RuntimeLocation = window.location,
  ): Promise<LoginResponse> => {
    if (callbackCompletion?.key === callbackUrl) {
      return callbackCompletion.promise;
    }

    const promise = completeCallbackOnce(callbackUrl, idTokenExchange, env, location);
    callbackCompletion = { key: callbackUrl, promise };
    try {
      return await promise;
    } catch (err) {
      if (callbackCompletion?.key === callbackUrl) {
        callbackCompletion = null;
      }
      throw err;
    }
  },

  clearCallbackState: () => {
    callbackCompletion = null;
    safeRemoveItem(SSO_STATE_KEY);
    safeRemoveItem(SSO_NONCE_KEY);
    safeRemoveItem(SSO_CODE_VERIFIER_KEY);
  },
};
