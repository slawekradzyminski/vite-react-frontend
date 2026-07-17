import { test, expect } from '../fixtures/auth.fixture';
import { cartMocks } from '../mocks/cartMocks';
import { meMocks } from '../mocks/meMocks';
import { orderMocks } from '../mocks/orderMocks';
import { productsMocks } from '../mocks/productMocks';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > window.innerWidth + 1;
  });

  expect(hasOverflow).toBe(false);
}

test.describe('Responsive shell smoke checks', () => {
  test('keeps home shell stable on mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    await expect(page.getByTestId('mobile-menu-toggle')).toBeVisible();
    await expect(page.getByTestId('desktop-menu')).toBeHidden();
    await expect(page.getByTestId('home-welcome-section')).toBeVisible();
    await expect(page.getByTestId('home-products-button')).toBeVisible();
    await page.getByTestId('app-footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expect(page.getByTestId('footer-blog-link')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps login form usable on short mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    await page.goto('/login');

    await expect(page.getByTestId('login-form')).toBeVisible();
    await page.getByTestId('login-submit-button').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps cart page within the viewport on mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/cart');

    await expect(page.getByTestId('cart-page')).toBeVisible();
    await expect(page.getByTestId('cart-title')).toBeVisible();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps traffic monitor page within the viewport on mobile', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/traffic');

    await expect(page.getByTestId('traffic-monitor-page')).toBeVisible();
    await expect(page.getByTestId('traffic-title')).toBeVisible();
    await expect(page.getByTestId('app-footer')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps long product details within the viewport on mobile', async ({ authenticatedPage }) => {
    const { page, user } = authenticatedPage;
    const productId = 987654;
    await page.setViewportSize({ width: 375, height: 812 });
    await productsMocks.mockGetProductDetailsSuccess(page, productId, {
      id: productId,
      name: 'Extremely Long Product Name Without Convenient Breakpoints ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      description: 'A long product description used to verify responsive wrapping on narrow screens.',
      price: 1234.56,
      stockQuantity: 12,
      category: 'VeryLongCategoryNameWithoutBreakpoints',
      imageUrl: '',
    });
    await cartMocks.mockEmptyCart(page);
    await meMocks.mockAdminUser(page, user);
    await page.goto(`/products/${productId}`);

    await expect(page.getByTestId('product-details')).toBeVisible();
    await expect(page.getByTestId('product-title')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps long order details and admin controls within the viewport on mobile', async ({ authenticatedPage }) => {
    const { page, user } = authenticatedPage;
    const order = {
      id: 123456789,
      username: user.username,
      items: [{
        id: 1,
        productId: 1,
        quantity: 12,
        productName: 'Extremely Long Product Name Without Convenient Breakpoints ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        unitPrice: 1234.56,
        totalPrice: 14814.72,
      }],
      totalAmount: 14814.72,
      status: 'PENDING',
      shippingAddress: {
        street: '123 VeryLongStreetNameWithoutConvenientBreakpoints',
        city: 'Long City',
        state: 'State',
        zipCode: '12345',
        country: 'Country',
      },
      createdAt: '2026-07-15T00:00:00Z',
      updatedAt: '2026-07-15T00:00:00Z',
    };
    await page.setViewportSize({ width: 375, height: 812 });
    await orderMocks.mockOrderWithState(page, order);
    await meMocks.mockAdminUser(page, user);
    await page.goto(`/orders/${order.id}`);

    await expect(page.getByTestId('order-details')).toBeVisible();
    await expect(page.getByTestId('order-details-admin-controls')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
