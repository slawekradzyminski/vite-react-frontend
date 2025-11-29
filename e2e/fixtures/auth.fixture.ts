import { test as base, Page } from '@playwright/test';
import { createAuthenticatedUser, createAdminUser, cleanupUser, createClientUser } from '../utils/auth.utils';
import { User } from '../types/user';

type AuthenticatedPageFixtures = {
    authenticatedPage: {
        page: Page;
        user: User;
        token: string;
    };
    adminPage: {
        page: Page;
        user: User;
        token: string;
    };
    clientPage: {
        page: Page;
        user: User;
        token: string;
    };
};

export const test = base.extend<AuthenticatedPageFixtures>({
    authenticatedPage: async ({ page }, use) => {
        const { user, token, refreshToken } = await createAuthenticatedUser(page.context().request);

        await page.context().addInitScript(({ token, refreshToken }) => {
            window.localStorage.setItem('token', token);
            window.localStorage.setItem('refreshToken', refreshToken);
        }, { token, refreshToken });
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token,
            refreshToken,
        });

        await cleanupUser(page.context().request, user.username, token);
    },
    
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const { user, token, refreshToken } = await createAdminUser(context.request);

        await context.addInitScript(({ token, refreshToken }) => {
            window.localStorage.setItem('token', token);
            window.localStorage.setItem('refreshToken', refreshToken);
        }, { token, refreshToken });
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token,
            refreshToken,
        });

        await cleanupUser(context.request, user.username, token);
        await context.close();
    },

    clientPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const { user, token, refreshToken } = await createClientUser(context.request);

        await context.addInitScript(({ token, refreshToken }) => {
            window.localStorage.setItem('token', token);
            window.localStorage.setItem('refreshToken', refreshToken);
        }, { token, refreshToken });
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token,
            refreshToken,
        });

        await cleanupUser(context.request, user.username, token);
        await context.close();
    }
});

export { expect } from '@playwright/test'; 
