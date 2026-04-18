import { test as base, Page } from '@playwright/test';
import { SSO_PASSWORD, SSO_USERNAME } from '../config/sso.config';
import { getKeycloakIdToken } from '../http/keycloakToken';
import { postSsoExchange } from '../http/postSsoExchange';

type SsoAuthenticatedPageFixtures = {
  ssoAuthenticatedPage: {
    page: Page;
    username: string;
    token: string;
    refreshToken: string;
  };
};

export const test = base.extend<SsoAuthenticatedPageFixtures>({
  ssoAuthenticatedPage: async ({ page }, use) => {
    const idToken = await getKeycloakIdToken(page.context().request, {
      username: SSO_USERNAME,
      password: SSO_PASSWORD,
    });
    const loginResponse = await postSsoExchange(page.context().request, idToken);

    await page.context().addInitScript(({ token, refreshToken }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('refreshToken', refreshToken);
    }, {
      token: loginResponse.token,
      refreshToken: loginResponse.refreshToken,
    });

    await use({
      page,
      username: loginResponse.username,
      token: loginResponse.token,
      refreshToken: loginResponse.refreshToken,
    });
  },
});

export { expect } from '@playwright/test';
