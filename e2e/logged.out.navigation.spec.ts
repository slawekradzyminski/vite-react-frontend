import { test, expect } from './fixtures/auth.fixture';

test.describe('Navigation', () => {

  test('should redirect logged out users from Products page to login', async ({ page }) => {
    // when
    await page.goto('http://localhost:8081/products');
    
    // then
    await expect(page).toHaveURL(/\/login/);
  });
}); 