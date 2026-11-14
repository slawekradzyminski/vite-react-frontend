import { test as base, Page } from '@playwright/test';
import { createAuthenticatedUser, createAdminUser, cleanupUser, createClientUser } from '../utils/auth.utils';
import { User } from '../types/user';

// Seeds the fixture's tokens once per tab. Re-seeding on every navigation would put back a token
// the backend has since revoked (backend 3.20.0+ revokes a user's tokens when MFA is enabled or
// disabled) over the one a later sign-in in the test stored.
function seedSessionOnce({ token, refreshToken }: { token: string; refreshToken: string }) {
    if (window.sessionStorage.getItem('e2e-session-seeded')) {
        return;
    }
    window.sessionStorage.setItem('e2e-session-seeded', 'true');
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('refreshToken', refreshToken);
}

type AuthenticatedPageFixtures = {
    authenticatedPage: {
        page: Page;
        user: User;
        token: string;
        refreshToken: string;
    };
    adminPage: {
        page: Page;
        user: User;
        token: string;
        refreshToken: string;
    };
    clientPage: {
        page: Page;
        user: User;
        token: string;
        refreshToken: string;
    };
};

export const test = base.extend<AuthenticatedPageFixtures>({
    authenticatedPage: async ({ page }, use) => {
        const { user, token, refreshToken } = await createAuthenticatedUser(page.context().request);

        await page.context().addInitScript(seedSessionOnce, { token, refreshToken });
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token,
            refreshToken,
        });

        await cleanupUser(page.context().request, user.username);
    },
    
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const { user, token, refreshToken } = await createAdminUser(context.request);

        await context.addInitScript(seedSessionOnce, { token, refreshToken });
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token,
            refreshToken,
        });

        await context.close();
    },

    clientPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const { user, token, refreshToken } = await createClientUser(context.request);

        await context.addInitScript(seedSessionOnce, { token, refreshToken });
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ 
            page,
            user,
            token,
            refreshToken,
        });

        await cleanupUser(context.request, user.username);
        await context.close();
    }
});

export { expect } from '@playwright/test'; 
