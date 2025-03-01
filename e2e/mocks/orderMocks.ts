import { Page } from "@playwright/test";

export const orderMocks = {
    async mockOrderWithState(page: Page, orderState: any) {
        await page.route(`**/api/orders/${orderState.id}`, async (route) => {
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderState)
            });
        });
    },

    async mockCancelOrder(page: Page, orderState: any) {
        await page.route(`**/api/orders/${orderState.id}/cancel`, async (route) => {
            if (route.request().method() === 'POST') {
                orderState.status = 'CANCELLED';

                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderState)
                });
            }
        });

        await page.route(`**/api/orders/${orderState.id}`, async (route) => {
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderState)
            });
        });
    },

    async mockUpdateOrderStatus(page: Page, orderState: any) {
        await page.route(`**/api/orders/${orderState.id}/status`, async (route) => {
            if (route.request().method() === 'PUT') {
                orderState.status = 'SHIPPED'
                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderState)
                });
            }
        });

        await page.route(`**/api/orders/${orderState.id}`, async (route) => {
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderState)
            });
        });
    }
};
