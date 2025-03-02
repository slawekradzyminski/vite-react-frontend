import { test, expect } from '../fixtures/auth.fixture';

test.describe('Profile Page', () => {
  test('should display and update system prompt', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;
    await page.goto('/profile');
    await page.waitForSelector('h1:has-text("Profile")');
    await expect(page.getByRole('heading', { name: 'System Prompt' })).toBeVisible();
    
    // when
    const promptTextarea = page.getByLabel('Your System Prompt');
    await promptTextarea.fill('This is my updated system prompt');
    await page.getByRole('button', { name: 'Save Prompt' }).click();
    
    // then
    await expect(page.getByRole('button', { name: 'Save Prompt' })).toBeEnabled();
  });
  
  test('should display and update user information', async ({ authenticatedPage }) => {
    // given
    const { page, user } = authenticatedPage;
    await page.goto('/profile');
    await page.waitForSelector('h1:has-text("Profile")');
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveValue(user.email);
    
    // when
    const firstNameInput = page.getByLabel('First Name');
    const updatedName = `Updated${Date.now()}`;
    await firstNameInput.fill(updatedName);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // then
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    await page.reload();
    await page.waitForSelector('h1:has-text("Profile")');
    await expect(page.getByLabel('First Name')).toHaveValue(updatedName);
  });
  
  test('should display order history', async ({ authenticatedPage }) => {
    // given
    const { page } = authenticatedPage;

    // when
    await page.goto('/profile');
    await page.waitForSelector('h1:has-text("Profile")');
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible();
    
    // then
    const hasOrders = await page.locator('table').count() > 0;
    if (hasOrders) {
      await expect(page.getByRole('columnheader', { name: 'Order ID' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    } else {
      await expect(page.getByText("You don't have any orders yet.")).toBeVisible();
    }
  });
  
  test('navigation to profile page works', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // given
    await page.goto('/');
    
    // when
    await page.getByRole('link', { name: 'Profile' }).click();
    
    // then
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
  });
}); 