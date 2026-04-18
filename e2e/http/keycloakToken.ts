import { APIRequestContext, expect } from '@playwright/test';
import { SSO_AUTHORITY, SSO_CLIENT_ID } from '../config/sso.config';

type KeycloakTokenResponse = {
  id_token: string;
};

export async function getKeycloakIdToken(
  request: APIRequestContext,
  credentials: { username: string; password: string },
): Promise<string> {
  const response = await request.post(`${SSO_AUTHORITY}/protocol/openid-connect/token`, {
    form: {
      grant_type: 'password',
      client_id: SSO_CLIENT_ID,
      username: credentials.username,
      password: credentials.password,
      scope: 'openid profile email',
    },
  });

  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json() as KeycloakTokenResponse;
  expect(body.id_token).toBeTruthy();
  return body.id_token;
}
