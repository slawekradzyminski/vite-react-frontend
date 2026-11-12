import { test, expect } from '../fixtures/mocked-session.fixture';
import { cartMocks } from '../mocks/cartMocks';
import { fulfillWithSchema } from '../mocks/backendContract';

// Shop behaviour around requests in flight, against a mocked backend.
test.describe('Shop guards (mocked backend)', () => {
  test('the Shop API selector stays disabled while a cart write is pending (T-066)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    const product = { id: 7, name: 'Desk Lamp', price: 25, category: 'Home', description: 'A lamp', imageUrl: '', stockQuantity: 4 };
    await cartMocks.mockEmptyCart(page);
    await page.route('**/api/v1/products/7', (route) => fulfillWithSchema(route, 'ProductDto', product));
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    await page.route('**/api/v1/cart/items', async (route) => {
      await held;
      await fulfillWithSchema(route, 'CartDto', { items: [{ productId: 7, quantity: 1 }], totalPrice: 25, totalItems: 1 });
    });
    await page.goto('/products/7');
    await expect(page.getByTestId('commerce-transport')).toBeEnabled();

    // when
    await page.getByTestId('add-to-cart').click();

    // then
    await expect(page.getByTestId('commerce-transport')).toBeDisabled();

    // when
    release();

    // then
    await expect(page.getByTestId('commerce-transport')).toBeEnabled();
  });
});
