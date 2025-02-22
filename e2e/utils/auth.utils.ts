import { APIRequestContext } from '@playwright/test';
import { getRandomUser } from '../generators/userGenerator';
import type { User } from '../types/user';
import { registerUser } from '../http/postSignUp';
import { postSignIn } from '../http/postSignIn';
import { deleteUser } from '../http/deleteUser';

export type AuthenticatedUser = {
    user: User;
    token: string;
};

export async function createAuthenticatedUser(request: APIRequestContext): Promise<AuthenticatedUser> {
    const newUser = getRandomUser();
    await registerUser(newUser);
    const { response: loginResponse, status: loginStatus } = await postSignIn(request, {
        username: newUser.username,
        password: newUser.password
    });
    if (loginStatus !== 200) {
        throw new Error(`Failed to login. Status: ${loginStatus}`);
    }

    return {
        user: newUser,
        token: loginResponse.token
    };
}

export async function cleanupUser(request: APIRequestContext, username: string, token: string): Promise<void> {
    const { status } = await deleteUser(request, username, token);
    if (status !== 204) {
        throw new Error(`Failed to delete user during cleanup. Status: ${status}`);
    }
} 