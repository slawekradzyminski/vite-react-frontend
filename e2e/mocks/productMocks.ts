import { Page, Route } from '@playwright/test';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

export const productsMocks = {
  async mockGetProducts(page: Page) {
    await page.route('**/api/products', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Product A', price: 100, category: 'Tech', description: 'A tech product', imageUrl: '/images/product-a.jpg' },
          { id: 2, name: 'Product B', price: 200, category: 'Home', description: 'A home product', imageUrl: '/images/product-b.jpg' },
          { id: 3, name: 'Product C', price: 150, category: 'Tech', description: 'Another tech product', imageUrl: '/images/product-c.jpg' },
          { id: 4, name: 'Product D', price: 300, category: 'Office', description: 'An office product', imageUrl: '/images/product-d.jpg' },
        ])
      });
    });
  },

  async mockEmptyProducts(page: Page) {
    await page.route('**/api/products', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
  },

};
