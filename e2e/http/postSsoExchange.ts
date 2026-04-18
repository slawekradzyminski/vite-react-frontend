import { APIRequestContext, expect } from '@playwright/test';
import { SSO_BACKEND_BASE_URL } from '../config/sso.config';
import { SignInResponse } from '../types/auth';

export async function postSsoExchange(
  request: APIRequestContext,
  idToken: string,
): Promise<SignInResponse> {
  const response = await request.post(`${SSO_BACKEND_BASE_URL}/api/v1/users/sso/exchange`, {
    data: { idToken },
  });

  expect(response.status(), await response.text()).toBe(200);
  return await response.json() as SignInResponse;
}
