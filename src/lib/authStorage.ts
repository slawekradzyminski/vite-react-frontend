const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const CLIENT_SESSION_ID_KEY = 'clientSessionId';

const getStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

const safeGetItem = (key: string) => {
  const storage = getStorage();
  return storage && typeof storage.getItem === 'function' ? storage.getItem(key) : null;
};

const safeSetItem = (key: string, value: string) => {
  const storage = getStorage();
  if (storage && typeof storage.setItem === 'function') {
    storage.setItem(key, value);
  }
};

const safeRemoveItem = (key: string) => {
  const storage = getStorage();
  if (storage && typeof storage.removeItem === 'function') {
    storage.removeItem(key);
  }
};

const generateClientSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `client-session-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

export type TokenPair = {
  token: string;
  refreshToken: string;
};

export const authStorage = {
  getTokens: () => ({
    token: safeGetItem(TOKEN_KEY),
    refreshToken: safeGetItem(REFRESH_TOKEN_KEY),
  }),
  setTokens: ({ token, refreshToken }: TokenPair) => {
    safeSetItem(TOKEN_KEY, token);
    safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    safeRemoveItem(TOKEN_KEY);
    safeRemoveItem(REFRESH_TOKEN_KEY);
  },
  getAccessToken: () => safeGetItem(TOKEN_KEY),
  getRefreshToken: () => safeGetItem(REFRESH_TOKEN_KEY),
  getClientSessionId: () => {
    const existing = safeGetItem(CLIENT_SESSION_ID_KEY);
    if (existing) {
      return existing;
    }
    const generated = generateClientSessionId();
    safeSetItem(CLIENT_SESSION_ID_KEY, generated);
    return generated;
  },
  setClientSessionId: (clientSessionId: string) => {
    safeSetItem(CLIENT_SESSION_ID_KEY, clientSessionId);
  },
};
