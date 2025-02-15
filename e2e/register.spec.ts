import { test, expect } from '@playwright/test';
import { getRandomUser } from './generators/userGenerator';
import { registerUser } from './http/postSignUp';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should successfully register with valid data', async ({ page }) => {
    // given
    const user = getRandomUser();

    // when
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.locator('[data-state="open"]')).toContainText('Registration successful');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should show error when username already exists', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);

    // when
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
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
    const user = getRandomUser();

    // when
    await page.getByLabel('Username').fill('123');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Username must be at least 4 characters')).toBeVisible();
  });

  test('should show validation error for password less than 8 characters', async ({ page }) => {
    // given
    const user = getRandomUser();

    // when
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('1234567');
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // given
    const user = getRandomUser();

    // when
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill(user.password);
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Invalid email format', { exact: false })).toBeVisible();
  });

  test('should show validation error for first name less than 4 characters', async ({ page }) => {
    // given
    const user = getRandomUser();

    // when
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByLabel('First Name').fill('123');
    await page.getByLabel('Last Name').fill(user.lastName);
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('First name must be at least 4 characters')).toBeVisible();
  });

  test('should show validation error for last name less than 4 characters', async ({ page }) => {
    // given
    const user = getRandomUser();

    // when
    await page.getByLabel('Username').fill('123');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByLabel('First Name').fill(user.firstName);
    await page.getByLabel('Last Name').fill('123');
    await page.getByRole('button', { name: 'Create account' }).click();

    // then
    await expect(page.getByText('Last name must be at least 4 characters')).toBeVisible();
  });
}); 