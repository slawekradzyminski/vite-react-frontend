import { test as base, Page } from '@playwright/test';
import { createAuthenticatedUser, cleanupUser } from '../utils/auth.utils';
import { User } from '../types/user';

type AuthenticatedPageFixtures = {
    authenticatedPage: {
        page: Page;
        user: User;
        token: string;
    };
};

export const test = base.extend<AuthenticatedPageFixtures>({
    authenticatedPage: async ({ page }, use) => {
        const { user, token } = await createAuthenticatedUser(page.context().request);
        
        await page.context().addInitScript(token => {
            window.localStorage.setItem('token', token);
        }, token);
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token
        });

        await cleanupUser(page.context().request, user.username, token);
    }
});

export { expect } from '@playwright/test'; 