const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

const isBrowser = () => typeof window !== 'undefined';

const safeGetItem = (key: string) => (isBrowser() ? window.localStorage.getItem(key) : null);
const safeSetItem = (key: string, value: string) => {
  if (isBrowser()) {
    window.localStorage.setItem(key, value);
  }
};
const safeRemoveItem = (key: string) => {
  if (isBrowser()) {
    window.localStorage.removeItem(key);
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
