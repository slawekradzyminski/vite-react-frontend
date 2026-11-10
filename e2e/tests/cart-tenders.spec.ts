import { test, expect } from '../fixtures/mocked-session.fixture';
import { CartTendersMock } from '../mocks/tenderMocks';

test.describe('Cart tenders', () => {
  test('a gift card and loyalty points reduce the amount due in cart and checkout', async ({ customerPage }) => {
    // given
    const { page, user } = customerPage;
    const tenders = new CartTendersMock(
      { username: user.username, items: [{ productId: 7, name: 'Headphones', quantity: 1, unitPrice: 99.99 }] },
      { 'GC-7KQ2-M9XD-4HPA': 25 },
      1250,
    );
    await tenders.install(page);
    await page.goto('/cart');
    await expect(page.getByTestId('cart-loyalty-balance')).toContainText('1,250 points (worth $12.50)');

    // when
    await page.getByLabel('Gift card code').fill('GC-NOPE');
    await page.getByTestId('cart-gift-card-apply').click();

    // then
    await expect(page.getByTestId('cart-gift-card-error')).toHaveText('Gift card not found');

    // when
    await page.getByLabel('Gift card code').fill('GC-7KQ2-M9XD-4HPA');
    await page.getByTestId('cart-gift-card-apply').click();

    // then
    await expect(page.getByTestId('cart-gift-card-amount')).toHaveText('Covers $25.00');
    await expect(page.getByTestId('cart-tenders-amount-due')).toHaveText('$74.99');

    // when
    await page.getByLabel('Points to redeem').fill('500');
    await expect(page.getByTestId('cart-loyalty-preview')).toHaveText('500 points = −$5.00');
    await page.getByTestId('cart-loyalty-apply').click();

    // then
    await expect(page.getByTestId('cart-loyalty-redeemed')).toHaveText('Redeeming 500 points (−$5.00)');
    await expect(page.getByTestId('cart-tenders-amount-due')).toHaveText('$69.99');

    // when
    await page.getByTestId('cart-checkout-button').click();

    // then
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByTestId('checkout-tenders-gift-card')).toHaveText('−$25.00');
    await expect(page.getByTestId('checkout-tenders-points')).toHaveText('−$5.00');
    await expect(page.getByTestId('checkout-tenders-amount-due')).toHaveText('$69.99');
    await expect(page.getByTestId('checkout-total-amount')).toHaveText('$69.99');
  });
});
