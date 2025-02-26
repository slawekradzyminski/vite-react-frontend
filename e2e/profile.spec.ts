import { test, expect } from './fixtures/auth.fixture';

test.describe('Profile Page', () => {
  test('should display and update system prompt', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // given
    await page.goto('/profile');
    
    // when
    await page.waitForSelector('h1:has-text("Profile")');
    
    // then
    await expect(page.getByRole('heading', { name: 'System Prompt' })).toBeVisible();
    
    // Update system prompt
    const promptTextarea = page.getByLabel('Your System Prompt');
    await promptTextarea.fill('This is my updated system prompt');
    await page.getByRole('button', { name: 'Save Prompt' }).click();
    
    // Verify it was saved (assuming the backend responds with success)
    // We can check if the button is re-enabled after saving
    await expect(page.getByRole('button', { name: 'Save Prompt' })).toBeEnabled();
  });
  
  test('should display and update user information', async ({ authenticatedPage }) => {
    const { page, user } = authenticatedPage;
    
    // given
    await page.goto('/profile');
    
    // when
    await page.waitForSelector('h1:has-text("Profile")');
    
    // then
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();
    
    // Check if user data is displayed
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveValue(user.email);
    
    // Update user information
    const firstNameInput = page.getByLabel('First Name');
    const updatedName = `Updated${Date.now()}`;
    await firstNameInput.fill(updatedName);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify it was saved (assuming the backend responds with success)
    // We can check if the button is re-enabled after saving
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    
    // Reload the page to verify changes persisted
    await page.reload();
    await page.waitForSelector('h1:has-text("Profile")');
    
    // Check if the updated name is displayed
    await expect(page.getByLabel('First Name')).toHaveValue(updatedName);
  });
  
  test('should display order history', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    
    // given
    await page.goto('/profile');
    
    // when
    await page.waitForSelector('h1:has-text("Profile")');
    
    // then
    await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible();
    
    // Check if orders are displayed or empty state is shown
    // Either orders are displayed or "You have no orders yet" message is shown
    const hasOrders = await page.locator('table').count() > 0;
    
    if (hasOrders) {
      // If orders exist, check the table headers
      await expect(page.getByRole('columnheader', { name: 'Order ID' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    } else {
      // If no orders, check for empty state message
      await expect(page.getByText('You have no orders yet')).toBeVisible();
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