import { test, expect } from '../fixtures/auth.fixture';
import { meMocks } from '../mocks/meMocks';
import { orderMocks } from '../mocks/orderMocks';
import { OrderDetailsPage } from '../pages/order-details.page.object';

test.describe('Order Details', () => {
  test('should display order details for a customer', async ({ authenticatedPage }) => {
    // given
    const orderState = {
        id: 1,
        username: authenticatedPage.user.username,
        status: 'PENDING',
        totalAmount: 39.98,
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        items: [
            {
                id: 1,
                productId: 1,
                productName: 'Test Product',
                quantity: 2,
                unitPrice: 19.99,
                totalPrice: 39.98
            }
        ],
        shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
        }
    };
    await orderMocks.mockOrderWithState(authenticatedPage.page, orderState);

    // when
    const orderDetailsPage = new OrderDetailsPage(authenticatedPage);
    await orderDetailsPage.navigateToOrder(orderState.id);

    // then
    await expect(orderDetailsPage.orderTitle).toBeVisible();
    await expect(orderDetailsPage.orderStatus).toHaveText('PENDING');
    await expect(orderDetailsPage.orderItems).toHaveCount(orderState.items.length);
    await expect(orderDetailsPage.totalAmount).toHaveText(`$${orderState.totalAmount.toFixed(2)}`);
    await expect(orderDetailsPage.shippingAddress).toContainText(orderState.shippingAddress.street);
  });

  test('should allow customer to cancel a pending order', async ({ authenticatedPage }) => {
    // given
    const orderState = {
        id: 2,
        username: authenticatedPage.user.username,
        status: 'PENDING',
        totalAmount: 29.99,
        items: [
            { id: 2, productId: 2, productName: 'Another Product', quantity: 1, unitPrice: 29.99, totalPrice: 29.99 }
        ],
        shippingAddress: {
            street: '123 Test St', city: 'Test City', state: 'Test State',
            zipCode: '12345', country: 'Test Country'
        }
    };
    await orderMocks.mockOrderWithState(authenticatedPage.page, orderState);
    await orderMocks.mockCancelOrder(authenticatedPage.page, orderState);
    const orderDetailsPage = new OrderDetailsPage(authenticatedPage);
    
    // when 1
    await orderDetailsPage.navigateToOrder(orderState.id);

    // then 1
    await expect(orderDetailsPage.orderStatus).toHaveText('PENDING');
    await expect(orderDetailsPage.cancelButton).toBeVisible();
    
    // when 2
    await orderDetailsPage.cancelOrder();

    // then 2
    await expect(orderDetailsPage.orderStatus).toHaveText('CANCELLED');
    await expect(orderDetailsPage.cancelButton).not.toBeVisible();
});

test('should allow admin to update order status', async ({ adminPage }) => {
  // given
  const orderState = {
      id: 3,
      username: 'someuser',
      status: 'PAID',
      totalAmount: 49.99,
      items: [
          { id: 3, productId: 3, productName: 'Admin Test Product', quantity: 1, unitPrice: 49.99, totalPrice: 49.99 }
      ],
      shippingAddress: {
          street: '123 Admin St',
          city: 'Admin City',
          state: 'Admin State',
          zipCode: '54321',
          country: 'Admin Country'
      }
  };

  await orderMocks.mockOrderWithState(adminPage.page, orderState);
  await orderMocks.mockUpdateOrderStatus(adminPage.page, orderState);
  const adminOrderDetailsPage = new OrderDetailsPage(adminPage);
  await adminOrderDetailsPage.navigateToOrder(orderState.id);

  // when
  await adminOrderDetailsPage.updateOrderStatus('SHIPPED');

  // then
  await expect(adminOrderDetailsPage.orderStatus).toHaveText('SHIPPED');
});

test('should not show admin controls for regular customers', async ({ authenticatedPage }) => {
  // given
  const orderId = 1;
  const orderState = {
      id: orderId,
      username: authenticatedPage.user.username,
      status: 'PENDING',
      totalAmount: 39.98,
      items: [
          { id: 1, productId: 1, productName: 'Test Product', quantity: 2, unitPrice: 19.99, totalPrice: 39.98 }
      ],
      shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
      }
  };
  await orderMocks.mockOrderWithState(authenticatedPage.page, orderState);
  await meMocks.mockRegularCustomer(authenticatedPage.page, authenticatedPage.user);

  // when
  const orderDetailsPage = new OrderDetailsPage(authenticatedPage);
  await orderDetailsPage.navigateToOrder(orderId);

  // then
  await expect(orderDetailsPage.statusSelect).not.toBeVisible();
  await expect(orderDetailsPage.updateButton).not.toBeVisible();
  }); 
}); 