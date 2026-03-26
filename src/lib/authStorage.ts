const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

const isBrowser = () => typeof window !== 'undefined';

const getStorage = () => (isBrowser() ? window.localStorage : null);

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

export const authStorage = {
  getTokens: () => ({
    token: safeGetItem(TOKEN_KEY),
    refreshToken: safeGetItem(REFRESH_TOKEN_KEY),
  }),
  setTokens: ({ token, refreshToken }: { token: string; refreshToken: string }) => {
    safeSetItem(TOKEN_KEY, token);
    safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    safeRemoveItem(TOKEN_KEY);
    safeRemoveItem(REFRESH_TOKEN_KEY);
  },
  getAccessToken: () => safeGetItem(TOKEN_KEY),
  getRefreshToken: () => safeGetItem(REFRESH_TOKEN_KEY),
};
