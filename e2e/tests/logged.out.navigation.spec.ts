import { test, expect } from '../fixtures/auth.fixture';
import { APP_BASE_URL } from '../config/constants';

test.describe('Navigation', () => {

  test('should redirect logged out users from Products page to login', async ({ page }) => {
    // when
    await page.goto(`${APP_BASE_URL}/products`);
    
    // then
    await expect(page).toHaveURL(/\/login/);
  });
});
