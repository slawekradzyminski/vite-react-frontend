import { BACKEND_URL } from '../config/constants';
import { test, expect } from '../fixtures/auth.fixture';
import { TrafficPage } from '../pages/traffic.page.object';

test.describe('Traffic Monitor Page', () => {
  let trafficPage: TrafficPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    trafficPage = new TrafficPage(authenticatedPage.page);
    await trafficPage.goto();
  });


  test('should connect to WebSocket and show connected status', async () => {
    // when
    await trafficPage.waitForConnection();
    
    // then
    await expect(trafficPage.statusPill).toContainText('Connected');
    await expect(trafficPage.statusMessage).toContainText('Connected to traffic monitor');
  });

  test('should display traffic events when API requests are made', async ({ authenticatedPage, request }) => {
    // given
    const { page, token } = authenticatedPage;
    
    // when
    await trafficPage.waitForConnection();
    await request.get(`${BACKEND_URL}/api/products`, authHeaders(token));
    await request.get(`${BACKEND_URL}/api/products/1`, authHeaders(token));
    await page.waitForTimeout(1000);

    // then
    await expect(trafficPage.trafficEventsTable).toBeVisible();
    const methodElement1 = page.locator('td:has-text("/api/products")').first();
    await expect(methodElement1).toBeVisible();
    const methodElement2 = page.locator('td:has-text("/api/products/1")').first();
    await expect(methodElement2).toBeVisible();
    const statusElement1 = page.locator('td:has-text("200")').first();
    await expect(statusElement1).toBeVisible();
  });

  // given
  test('should clear events when clicking clear button', async ({ authenticatedPage, request }) => {
    // given
    const { page, token } = authenticatedPage;

    await trafficPage.waitForConnection();
    await request.get(`${BACKEND_URL}/api/products`, authHeaders(token));
    await request.get(`${BACKEND_URL}/api/products/1`, authHeaders(token));
    await page.waitForTimeout(1000);
    const methodElement1 = page.locator('td:has-text("/api/products")').first();
    await expect(methodElement1).toBeVisible();
    
    // when
    await trafficPage.clearEvents();
    
    // then
    await expect(trafficPage.noEventsMessage).toBeVisible();
  });
}); 

const authHeaders = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});