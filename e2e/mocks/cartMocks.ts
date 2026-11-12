import { Page } from "@playwright/test";
import { fulfillWithSchema, type BackendSchema } from "./backendContract";

// The backend cart only holds product ids and quantities; the frontend looks up names, prices,
// and images per product. A fixture keeps both halves together so each mock serves the same data.
export interface CartFixtureItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  // Set when the product price moved after the line was added: the cart keeps unitPrice
  // and the product now costs currentPrice.
  currentPrice?: number;
}

export interface CartFixture {
  username: string;
  items: CartFixtureItem[];
}

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150";

export const toCartDto = (cart: CartFixture): BackendSchema<"CartDto"> => ({
  username: cart.username,
  items: cart.items.map(({ productId, quantity, unitPrice, currentPrice }) =>
    currentPrice === undefined
      ? { productId, quantity }
      : { productId, quantity, unitPrice, priceChanged: true, currentPrice }),
  totalPrice: Number(cart.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)),
  totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
});

const toProductDto = (item: CartFixtureItem): BackendSchema<"ProductDto"> => ({
  id: item.productId,
  name: item.name,
  price: item.currentPrice ?? item.unitPrice,
  imageUrl: item.imageUrl ?? PLACEHOLDER_IMAGE,
  description: "Test description",
  stockQuantity: 10,
  category: "Test Category",
});

const mockProductsOf = async (page: Page, cart: CartFixture) => {
  for (const item of cart.items) {
    await page.route(`**/api/v1/products/${item.productId}`, async (route) => {
      await fulfillWithSchema(route, "ProductDto", toProductDto(item));
    });
  }
};

const emptyCart = (cart: CartFixture) => {
  cart.items = [];
};

export const cartMocks = {
  async mockEmptyCart(page: Page) {
    await page.route("**/api/v1/cart", async (route) => {
      await fulfillWithSchema(route, "CartDto", { items: [], totalPrice: 0, totalItems: 0 });
    });
  },

  async mockCartWithItems(page: Page) {
    await cartMocks.mockCartWithState(page, {
      username: "testuser",
      items: [
        { productId: 1, name: "Test Product 1", quantity: 2, unitPrice: 19.99 },
        { productId: 2, name: "Test Product 2", quantity: 1, unitPrice: 29.99 },
      ],
    });
  },

  async mockCartWithState(page: Page, cart: CartFixture) {
    await page.route("**/api/v1/cart", async (route) => {
      await fulfillWithSchema(route, "CartDto", toCartDto(cart));
    });
    await mockProductsOf(page, cart);
  },

  async mockAddCartItem(page: Page) {
    await page.route("**/api/v1/cart/items", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });
  },

  async mockUpdateSuccess(page: Page, productId: number) {
    await page.route(`**/api/v1/cart/items/${productId}`, async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });
  },

  async mockUpdateCartState(page: Page, cart: CartFixture) {
    await page.route("**/api/v1/cart/items/1", async (route) => {
      if (route.request().method() === "PUT") {
        cart.items[0].quantity = 2;
        await fulfillWithSchema(route, "CartDto", toCartDto(cart));
      }
    });
  },

  async mockRemoveCartItem(page: Page, cart: CartFixture) {
    await page.route("**/api/v1/cart/items/1", async (route) => {
      if (route.request().method() === "DELETE") {
        emptyCart(cart);
        await fulfillWithSchema(route, "CartDto", toCartDto(cart));
      }
    });
  },

  async mockCartForClearTest(page: Page, cart: CartFixture) {
    await page.route("**/api/v1/cart", async (route) => {
      const method = route.request().method();
      if (method === "DELETE") {
        emptyCart(cart);
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else if (method === "GET") {
        await fulfillWithSchema(route, "CartDto", toCartDto(cart));
      } else {
        await route.continue();
      }
    });
    await mockProductsOf(page, cart);
  },
};
