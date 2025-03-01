import { Page } from "@playwright/test";

export const cartMocks = {
  async mockEmptyCart(page: Page) {
    await page.route("**/api/cart", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [],
          totalPrice: 0,
          totalItems: 0,
        }),
      });
    });
  },

  async mockCartWithItems(page: Page) {
    await page.route("**/api/cart", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          items: [
            {
              productId: 1,
              productName: "Test Product 1",
              quantity: 2,
              unitPrice: 19.99,
              totalPrice: 39.98,
            },
            {
              productId: 2,
              productName: "Test Product 2",
              quantity: 1,
              unitPrice: 29.99,
              totalPrice: 29.99,
            },
          ],
          totalPrice: 69.97,
          totalItems: 3,
        }),
      });
    });
  },

  async mockCartWithState(page: Page, cartState: any) {
    await page.route("**/api/cart", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartState),
      });
    });
  },

  async mockUpdateCartState(page: Page, cartState: any) {
    await page.route("**/api/cart/items/1", async (route) => {
      if (route.request().method() === "PUT") {
        cartState.items[0].quantity = 2;
        cartState.items[0].totalPrice = cartState.items[0].unitPrice * 2;
        cartState.totalItems = 2;
        cartState.totalPrice = cartState.items[0].totalPrice;

        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartState),
        });
      }
    });
  },

  async mockRemoveCartItem(page: Page, cartState: any) {
    await page.route("**/api/cart/items/1", async (route) => {
      if (route.request().method() === "DELETE") {
        cartState.items = [];
        cartState.totalPrice = 0;
        cartState.totalItems = 0;

        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartState),
        });
      }
    });
  },

  async mockRemoveCart(page: Page, cartState: any) {
    await page.route("**/api/cart", async (route) => {
      if (route.request().method() === "DELETE") {
        cartState.items = [];
        cartState.totalPrice = 0;
        cartState.totalItems = 0;
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await route.continue();
      }
    });
  },

  async mockCartForClearTest(page: Page, cartState: any) {
    await page.route("**/api/cart", async (route) => {
      const method = route.request().method();
      if (method === "DELETE") {
        cartState.items = [];
        cartState.totalPrice = 0;
        cartState.totalItems = 0;
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else if (method === "GET") {
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartState)
        });
      } else {
        await route.continue();
      }
    });
  },
};
