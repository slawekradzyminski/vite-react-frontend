import { Page } from "@playwright/test";
import { Role } from "../../src/types/auth";

export const meMocks = {
    async mockRegularCustomer(page: Page, user: any) {
        await page.route('**/users/me', async (route) => {
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id || 888,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: [Role.CLIENT]
                })
            });
        });
    },

    async mockAdminUser(page: Page, user: any) {
        await page.route('**/api/users/me', async (route) => {
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id || 999,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: [Role.ADMIN]
                })
            });
        });
    }
};
