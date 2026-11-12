import { test, expect } from '../fixtures/mocked-session.fixture';
import { fulfillWithSchema } from '../mocks/backendContract';
import { cartMocks } from '../mocks/cartMocks';
import { IDEMPOTENCY_KEY_PATTERN, PaymentServiceMock, pendingOrder } from '../mocks/paymentMocks';
import { PaymentPage } from '../pages/payment.page.object';

test.describe('Card payments', () => {
  test('checkout leads to the card form and a 4242 card is captured', async ({ customerPage }) => {
    // given
    const { page, user } = customerPage;
    const order = pendingOrder(42, user.username);
    const paymentService = new PaymentServiceMock(order);
    await cartMocks.mockCartWithState(page, {
      username: user.username,
      items: [{ productId: 3, name: 'Desk lamp', quantity: 3, unitPrice: 19.99 }],
    });
    await page.route('**/api/v1/orders', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await fulfillWithSchema(route, 'OrderDto', order, 201);
    });
    await paymentService.install(page);
    const paymentPage = new PaymentPage(page);

    // when
    await page.goto('/checkout');
    for (const [field, value] of Object.entries({ street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zip: '00-001', country: 'Poland' })) {
      await page.getByTestId(`checkout-${field}-input`).fill(value);
    }
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(page).toHaveURL(/\/orders\/42\/pay$/);
    await expect(paymentPage.amountDue).toHaveText('$59.97');
    await expect(paymentPage.submit).toHaveText('Pay $59.97');

    // when
    await paymentPage.payWith('4242 4242 4242 4242');

    // then
    await expect(paymentPage.success).toContainText('Payment received');
    await expect(paymentPage.success).toContainText('Visa •••• 4242');
    expect(paymentService.idempotencyKeys).toHaveLength(1);
    expect(paymentService.idempotencyKeys[0]).toMatch(IDEMPOTENCY_KEY_PATTERN);
    await paymentPage.successOrderLink.click();
    await expect(page).toHaveURL(/\/orders\/42$/);
    await expect(page.getByTestId('order-details-status')).toHaveText('PAID');
    await expect(page.getByTestId('order-payment-status')).toHaveText('Captured');
    await expect(page.getByTestId('order-payment-card')).toHaveText('Visa •••• 4242');
  });

  // Regression for BUG-CHECKOUT-01: React Router commits the navigation in a transition, so on a slow
  // device the checkout is still rendered when the emptied cart is refetched. It must not redirect to /cart.
  test('a placed order opens its payment page on a slow device although the refetched cart is empty', async ({ customerPage }) => {
    // given
    const { page, user } = customerPage;
    const order = pendingOrder(43, user.username);
    const paymentService = new PaymentServiceMock(order);
    const cart = { username: user.username, items: [{ productId: 3, name: 'Desk lamp', quantity: 3, unitPrice: 19.99 }] };
    await cartMocks.mockCartWithState(page, cart);
    await page.route('**/api/v1/orders', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      cart.items = [];
      await fulfillWithSchema(route, 'OrderDto', order, 201);
    });
    await paymentService.install(page);
    const paymentPage = new PaymentPage(page);
    const visited: string[] = [];
    page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname); });
    await page.goto('/checkout');
    for (const [field, value] of Object.entries({ street: 'Main 1', city: 'Warsaw', state: 'Mazovia', zip: '00-001', country: 'Poland' })) {
      await page.getByTestId(`checkout-${field}-input`).fill(value);
    }
    // a slow device: Chromium runs the page's JavaScript 20x slower (6x only fails some of the runs with instant mocks)
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });

    // when
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(paymentPage.amountDue).toBeVisible({ timeout: 10_000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    expect(visited, 'the checkout must never bounce to the empty cart').not.toContain('/cart');
    await expect(page).toHaveURL(/\/orders\/43\/pay$/);
    await expect(paymentPage.amountDue).toHaveText('$59.97');
  });

  test('a declined card explains the failure and another card can be tried', async ({ customerPage }) => {
    // given
    const { page, user } = customerPage;
    const paymentService = new PaymentServiceMock(pendingOrder(43, user.username));
    await paymentService.install(page);
    const paymentPage = new PaymentPage(page);
    await paymentPage.goto(43);

    // when
    await paymentPage.useTestCard('4000000000000002');

    // then
    await expect(paymentPage.failedMessage).toHaveText('Your card was declined. Try another card.');

    // when
    await paymentPage.tryAnotherCard.click();
    await paymentPage.payWith('5555 5555 5555 4444');

    // then
    await expect(paymentPage.success).toContainText('Mastercard •••• 4444');
    expect(new Set(paymentService.idempotencyKeys).size).toBe(2);
  });

  test('3-D Secure: the challenge dialog accepts the code and captures the payment', async ({ customerPage }) => {
    // given
    const { page, user } = customerPage;
    await new PaymentServiceMock(pendingOrder(44, user.username)).install(page);
    const paymentPage = new PaymentPage(page);
    await paymentPage.goto(44);

    // when
    await paymentPage.payWith('4000 0000 0000 3220');

    // then
    await expect(paymentPage.threeDsDialog).toBeVisible();
    await expect(paymentPage.threeDsDialog).toContainText('Use 123456');
    await expect(paymentPage.threeDsCode).toBeFocused();

    // when
    await paymentPage.threeDsCode.fill('123456');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(paymentPage.threeDsSubmit).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(paymentPage.threeDsCode).toBeFocused();
    await paymentPage.threeDsSubmit.click();

    // then
    await expect(paymentPage.threeDsDialog).toBeHidden();
    await expect(paymentPage.success).toContainText('Payment received');
  });

  test('an asynchronous payment shows Processing until it is captured', async ({ customerPage }) => {
    // given
    const { page, user } = customerPage;
    const paymentService = new PaymentServiceMock(pendingOrder(45, user.username), { pollsBeforeSettling: 1 });
    await paymentService.install(page);
    const paymentPage = new PaymentPage(page);
    await paymentPage.goto(45);

    // when
    await paymentPage.payWith('4000 0000 0000 0077');

    // then
    await expect(paymentPage.processing).toContainText('Processing…');
    await expect(paymentPage.success).toContainText('Payment received', { timeout: 10_000 });
  });
});
