import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should successfully register with valid data', async ({ page }) => {
    // given
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;
    const password = 'password123';
    const firstName = 'John';
    const lastName = 'Smith';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.locator('[data-state="open"]')).toContainText('Registration successful');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should show error when username already exists', async ({ page }) => {
    // given
    const username = 'admin';
    const email = 'unique@example.com';
    const password = 'password123';
    const firstName = 'John';
    const lastName = 'Smith';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Username already exists', { exact: false })).toBeVisible();
    await expect(page).toHaveURL('/register');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // when
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Username is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Email is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Password is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('First name is required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Last name is required')).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error for username less than 4 characters', async ({ page }) => {
    // given
    const username = 'abc';
    const email = 'test@example.com';
    const password = 'password123';
    const firstName = 'John';
    const lastName = 'Smith';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Username must be at least 4 characters')).toBeVisible();
  });

  test('should show validation error for password less than 8 characters', async ({ page }) => {
    // given
    const username = 'testuser';
    const email = 'test@example.com';
    const password = '1234567';
    const firstName = 'John';
    const lastName = 'Smith';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // given
    const username = 'testuser';
    const email = 'invalid-email';
    const password = 'password123';
    const firstName = 'John';
    const lastName = 'Smith';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Invalid email format', { exact: false })).toBeVisible();
  });

  test('should show validation error for first name less than 4 characters', async ({ page }) => {
    // given
    const username = 'testuser';
    const email = 'test@example.com';
    const password = 'password123';
    const firstName = 'Bob';
    const lastName = 'Smith';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('First name must be at least 4 characters')).toBeVisible();
  });

  test('should show validation error for last name less than 4 characters', async ({ page }) => {
    // given
    const username = 'testuser';
    const email = 'test@example.com';
    const password = 'password123';
    const firstName = 'John';
    const lastName = 'Doe';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Last name must be at least 4 characters')).toBeVisible();
  });
}); 