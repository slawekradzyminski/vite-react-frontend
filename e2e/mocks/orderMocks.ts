import { Page } from "@playwright/test";
import { fulfillWithSchema, type BackendSchema } from "./backendContract";

export type OrderState = BackendSchema<'OrderDto'> & { id: number };

export const orderMocks = {
    async mockOrderWithState(page: Page, orderState: OrderState) {
        await page.route(`**/api/v1/orders/${orderState.id}`, async (route) => {
            await fulfillWithSchema(route, 'OrderDto', orderState);
        });
    },

    async mockCancelOrder(page: Page, orderState: OrderState) {
        await page.route(`**/api/v1/orders/${orderState.id}/cancel`, async (route) => {
            if (route.request().method() === 'POST') {
                orderState.status = 'CANCELLED';
                await fulfillWithSchema(route, 'OrderDto', orderState);
            }
        });

        await page.route(`**/api/v1/orders/${orderState.id}`, async (route) => {
            await fulfillWithSchema(route, 'OrderDto', orderState);
        });
    },

    async mockUpdateOrderStatus(page: Page, orderState: OrderState) {
        await page.route(`**/api/v1/orders/${orderState.id}/status`, async (route) => {
            if (route.request().method() === 'PUT') {
                orderState.status = 'SHIPPED'
                await fulfillWithSchema(route, 'OrderDto', orderState);
            }
        });

        await page.route(`**/api/v1/orders/${orderState.id}`, async (route) => {
            await fulfillWithSchema(route, 'OrderDto', orderState);
        });
    }
};
