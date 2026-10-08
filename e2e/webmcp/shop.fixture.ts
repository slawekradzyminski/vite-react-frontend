import { randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Cart } from '../../src/types/cart';
import type { Product } from '../../src/types/product';
import type { ToolResult } from '../../src/features/webmcp/webmcp-model';

const backend = process.env.WEBMCP_BACKEND_URL ?? 'http://localhost:8081';
type Shop = {
  page: Page;
  namespace: string;
  username: string;
  cheap: Product;
  expensive: Product;
  unavailable: Product;
  saved: () => Promise<Cart>;
  saveOutsidePage: (productId: number, quantity: number) => Promise<void>;
  open: (options?: { fault?: string; tools?: string }) => Promise<void>;
};

export const test = base.extend<{ shop: Shop }>({
  shop: async ({ page, request }, use) => {
    const namespace = `WebMCP-${randomUUID().slice(0, 8)}`;
    const username = namespace.toLowerCase();
    const password = `Lab-${randomUUID()}`;
    const adminResponse = await request.post(`${backend}/api/v1/users/signin`, {
      data: { username: process.env.ADMIN_USERNAME ?? 'admin', password: process.env.ADMIN_PASSWORD ?? 'LocalDemoAdmin123!' },
    });
    expect(adminResponse.status()).toBe(200);
    const admin = await adminResponse.json();
    const adminHeaders = { Authorization: `Bearer ${admin.token}` };
    const seeded: Product[] = [];
    let userCreated = false;
    let headers: Record<string, string> | undefined;
    try {
      const signup = await request.post(`${backend}/api/v1/users/signup`, {
        data: { username, password, email: `${username}@example.test`, firstName: 'Demo', lastName: 'Shopper' },
      });
      expect(signup.status()).toBe(201);
      userCreated = true;
      const loginResponse = await request.post(`${backend}/api/v1/users/signin`, { data: { username, password } });
      expect(loginResponse.status()).toBe(200);
      const login = await loginResponse.json();
      headers = { Authorization: `Bearer ${login.token}` };
      await page.addInitScript(({ token, refreshToken }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      }, { token: login.token, refreshToken: login.refreshToken });
      for (const [name, price, stockQuantity] of [['Cable', 12.5, 5], ['Charger', 25, 5], ['Adapter', 1, 0]] as const) {
        const response = await request.post(`${backend}/api/v1/products`, {
          headers: adminHeaders,
          data: { name: `${namespace} ${name}`, description: 'Isolated WebMCP experiment product.', category: namespace, price, stockQuantity, imageUrl: '' },
        });
        expect(response.status()).toBe(201);
        seeded.push(await response.json());
      }
      const shop: Shop = {
        page, namespace, username, cheap: seeded[0], expensive: seeded[1], unavailable: seeded[2],
        saveOutsidePage: async (productId, quantity) => {
          expect((await request.post(`${backend}/api/v1/cart/items`, { headers, data: { productId, quantity } })).status()).toBe(200);
        },
        saved: async () => {
          const response = await request.get(`${backend}/api/v1/cart`, { headers });
          expect(response.status()).toBe(200);
          return response.json();
        },
        open: async (options = {}) => {
          const params = new URLSearchParams({ query: namespace, ...options });
          await page.goto(`/webmcp?${params}`);
          await expect(page.getByTestId('webmcp-page')).toBeVisible();
          await expect(page.getByTestId('webmcp-product-' + seeded[0].id)).toBeVisible();
          await expect(page.getByTestId('webmcp-cart-total')).toHaveText('$0.00');
          if (options.tools !== 'off') await expect(page.getByTestId('webmcp-status')).toHaveText('3 native WebMCP tools registered');
        },
      };
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(shop);
    } finally {
      if (headers) expect((await request.delete(`${backend}/api/v1/cart`, { headers })).status()).toBe(204);
      for (const product of seeded) expect((await request.delete(`${backend}/api/v1/products/${product.id}`, { headers: adminHeaders })).status()).toBe(204);
      if (userCreated) expect((await request.delete(`${backend}/api/v1/users/${username}`, { headers: adminHeaders })).status()).toBe(204);
    }
  },
});

export function decode<T>(result: ToolResult): T {
  expect(result.isError).not.toBe(true);
  return JSON.parse(result.content[0].text) as T;
}
export { expect };
