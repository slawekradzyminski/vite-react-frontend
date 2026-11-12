import { test, expect } from '../fixtures/mocked-session.fixture';
import { cartMocks } from '../mocks/cartMocks';
import { expectNoAxeViolations } from '../utils/axe.utils';

// axe-core scans (WCAG 2.1 AA + best practices) of the pages whose accessibility defects were
// fixed in 3.13.0. Every API call is mocked, so the scans see stable content.
test.describe('Axe accessibility scans (mocked backend)', () => {
  test('checkout validation errors meet the contrast minimum (T-049)', async ({ mockedClient }) => {
    // given
    const { page } = mockedClient;
    await cartMocks.mockCartWithItems(page);
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-form')).toBeVisible();

    // when
    await page.getByTestId('checkout-submit-button').click();

    // then
    await expect(page.getByTestId('checkout-street-error')).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
