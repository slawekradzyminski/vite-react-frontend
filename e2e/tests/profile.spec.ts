import { test, expect } from '../fixtures/auth.fixture';
import { ProfilePage } from '../pages/profile.page.object';

test.describe('Profile Page', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ authenticatedPage }) => {
    profilePage = new ProfilePage(authenticatedPage.page);
    await profilePage.goto();
  });

  // given
  test('should display and update system prompt', async () => {
    // when
    await expect(profilePage.systemPromptHeading).toBeVisible();
    await profilePage.updateSystemPrompt('This is my updated system prompt');
    
    // then
    await expect(profilePage.savePromptButton).toBeEnabled();
  });
  
  // given
  test('should display and update user information', async ({ authenticatedPage }) => {
    const { user } = authenticatedPage;
    
    // when
    await expect(profilePage.personalInfoHeading).toBeVisible();
    // Backend 3.18.0 stores emails in lower case; the generated address is mixed case.
    await expect(profilePage.emailInput).toHaveValue(user.email.toLowerCase());
    
    const updatedName = `Updated${Date.now()}`;
    await profilePage.updateFirstName(updatedName);
    
    // then
    await expect(profilePage.saveChangesButton).toBeEnabled();
    await authenticatedPage.page.reload();
    await authenticatedPage.page.waitForSelector('h1:has-text("Profile")');
    await expect(profilePage.firstNameInput).toHaveValue(updatedName);
  });
  
  // given
  test('should display order history', async () => {
    // when
    await expect(profilePage.ordersHeading).toBeVisible();
    
    // then
    const hasOrders = await profilePage.hasOrders();
    if (hasOrders) {
      await expect(profilePage.orderIdColumnHeader).toBeVisible();
      await expect(profilePage.dateColumnHeader).toBeVisible();
      await expect(profilePage.statusColumnHeader).toBeVisible();
      await expect(profilePage.totalColumnHeader).toBeVisible();
    } else {
      await expect(profilePage.noOrdersMessage).toBeVisible();
    }
  });
}); 