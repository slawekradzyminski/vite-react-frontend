import { test, expect } from '@playwright/test';
import { getRandomUser } from './generators/userGenerator';
import { registerUser } from './http/postSignUp'; 

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // given
    const user = getRandomUser();
    await registerUser(user);
    const username = user.username;
    const password = user.password;

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // then
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // given
    const username = 'invalid';
    const password = 'invalid';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // then
    await expect(page.getByText('Invalid username/password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // when
    await page.getByRole('button', { name: 'Sign in' }).click();

    // then
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation error for username less than 4 characters', async ({ page }) => {
    // given
    const username = 'abc';
    const password = 'validpass';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // then
    await expect(page.getByText('Username must be at least 4 characters')).toBeVisible();
  });

  test('should show validation error for password less than 4 characters', async ({ page }) => {
    // given
    const username = 'validuser';
    const password = 'abc';

    // when
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // then
    await expect(page.getByText('Password must be at least 4 characters')).toBeVisible();
  });
}); 