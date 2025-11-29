import { APIRequestContext } from '@playwright/test';
import { getRandomUser } from '../generators/userGenerator';
import type { User } from '../types/user';
import { registerUser } from '../http/postSignUp';
import { postSignIn } from '../http/postSignIn';
import { deleteUser } from '../http/deleteUser';
import { Role } from '../../src/types/auth';

export type AuthenticatedUser = {
    user: User;
    token: string;
    refreshToken: string;
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
        token: loginResponse.token,
        refreshToken: loginResponse.refreshToken,
    };
}

export async function createAdminUser(request: APIRequestContext): Promise<AuthenticatedUser> {
    const newUser = getRandomUser(); 
    newUser.roles = [Role.ADMIN];
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
        token: loginResponse.token,
        refreshToken: loginResponse.refreshToken,
    };
}

export async function createClientUser(request: APIRequestContext): Promise<AuthenticatedUser> {
    const newUser = getRandomUser(); 
    newUser.roles = [Role.CLIENT];
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
        token: loginResponse.token,
        refreshToken: loginResponse.refreshToken,
    };
}

export async function cleanupUser(request: APIRequestContext, username: string, token: string): Promise<void> {
    const { status } = await deleteUser(request, username, token);
    if (status !== 204) {
        throw new Error(`Failed to delete user during cleanup. Status: ${status}`);
    }
} 
