import { APIRequestContext } from '@playwright/test';
import { BACKEND_URL } from '../utils/constants';

export async function deleteUser(
    request: APIRequestContext,
    username: string,
    token?: string
): Promise<{ response: any; status: number }> {
    const headers: Record<string, string> = token ? {
        'Authorization': `Bearer ${token}`
    } : {};

    const response = await request.delete(`${BACKEND_URL}/users/${username}`, {
        headers
    });

    const status = response.status();
    let responseBody = null;
    
    try {
        const text = await response.text();
        responseBody = text ? JSON.parse(text) : null;
    } catch {
        // Response might be empty or not JSON
    }

    return {
        response: responseBody,
        status
    };
} 