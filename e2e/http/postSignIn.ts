import { APIRequestContext } from '@playwright/test';
import { BACKEND_URL } from '../utils/constants';
import { SignInRequest, SignInResponse } from '../types/auth';

export async function postSignIn(
  request: APIRequestContext,
  credentials: SignInRequest
): Promise<{ response: SignInResponse; status: number }> {
  const response = await request.post(`${BACKEND_URL}/users/signin`, {
    data: credentials
  });
  
  const responseBody = await response.json();
  
  return {
    response: responseBody,
    status: response.status()
  };
}