import { Page, Route } from '@playwright/test';
import { fulfillWithSchema, type BackendSchema } from './backendContract';
import { productSearchMocks } from './productSearchMocks';

export type Product = BackendSchema<'ProductDto'>;

const CATALOGUE: Product[] = [
  { id: 1, name: 'Product A', price: 100, category: 'Tech', description: 'A tech product', imageUrl: '/images/product-a.jpg' },
  { id: 2, name: 'Product B', price: 200, category: 'Home', description: 'A home product', imageUrl: '/images/product-b.jpg' },
  { id: 3, name: 'Product C', price: 150, category: 'Tech', description: 'Another tech product', imageUrl: '/images/product-c.jpg' },
  { id: 4, name: 'Product D', price: 300, category: 'Office', description: 'An office product', imageUrl: '/images/product-d.jpg' },
];

// The REST catalogue searches on the server and the GraphQL one lists every product, so the
// mocks serve both endpoints from the same products.
export const productsMocks = {
  async mockGetProducts(page: Page) {
    await page.route('**/api/v1/products', async (route: Route) => {
      await fulfillWithSchema(route, 'ProductDto', CATALOGUE);
    });
    await productSearchMocks.mockSearch(page, CATALOGUE.map((product) => ({ ...product, stockQuantity: 10, averageRating: null, reviewCount: 0 })));
  },

  async mockEmptyProducts(page: Page) {
    await page.route('**/api/v1/products', async (route: Route) => {
      await fulfillWithSchema(route, 'ProductDto', []);
    });
    await productSearchMocks.mockSearch(page, []);
  },

  async mockGetProductDetailsSuccess(page: Page, productId: number, productData: Product) {
    await page.route(`**/api/v1/products/${productId}`, async (route: Route) => {
      await fulfillWithSchema(route, 'ProductDto', productData);
    });
  },

  async mockGetProductDetailsNotFound(page: Page, productId: number) {
    await page.route(`**/api/v1/products/${productId}`, async (route: Route) => {
      await fulfillWithSchema(route, 'ErrorDto', { message: 'Product not found' }, 404);
    });
  },
};
