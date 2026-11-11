import { Page } from "@playwright/test";
import { fulfillWithPaymentSchema, fulfillWithSchema, type BackendSchema, type PaymentSchema } from "./backendContract";

export type OrderState = BackendSchema<'OrderDto'> & { id: number };

export const orderMocks = {
    // Order details also asks payment-service for the order's payments and warehouse-service for
    // its shipment. A mocked order does not exist there (or belongs to someone else), so both are
    // mocked with it: no payments and no shipment yet. Register a shipment mock after this one to
    // override the latter.
    async mockOrderWithState(page: Page, orderState: OrderState, payments: PaymentSchema<'PaymentDto'>[] = []) {
        await page.route(`**/api/v1/orders/${orderState.id}`, async (route) => {
            await fulfillWithSchema(route, 'OrderDto', orderState);
        });
        await orderMocks.mockOrderPayments(page, orderState.id, payments);
        await page.route(`**/api/v1/orders/${orderState.id}/shipment`, async (route) => {
            await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Shipment not found' }) });
        });
    },

    async mockOrderPayments(page: Page, orderId: number, payments: PaymentSchema<'PaymentDto'>[] = []) {
        await page.route(`**/api/v1/orders/${orderId}/payments`, async (route) => {
            await fulfillWithPaymentSchema(route, 'PaymentDto', payments);
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
