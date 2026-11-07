import { Page } from "@playwright/test";
import { Role } from "../../src/types/auth";
import { fulfillWithSchema, type BackendSchema } from "./backendContract";

type MockedUser = Omit<BackendSchema<'UserResponseDto'>, 'roles'>;

export const meMocks = {
    async mockRegularCustomer(page: Page, user: MockedUser) {
        await page.route('**/api/v1/users/me', async (route) => {
            await fulfillWithSchema(route, 'UserResponseDto', {
                id: user.id || 888,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [Role.CLIENT]
            });
        });
    },

    async mockAdminUser(page: Page, user: MockedUser) {
        await page.route('**/api/v1/users/me', async (route) => {
            await fulfillWithSchema(route, 'UserResponseDto', {
                id: user.id || 999,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [Role.ADMIN]
            });
        });
    }
};
