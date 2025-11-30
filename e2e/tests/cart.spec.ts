import { test, expect } from "../fixtures/auth.fixture";
import { cartMocks } from "../mocks/cartMocks";
import { CartPage } from "../pages/cart.page.object";

test.describe("Cart Page", () => {
  test("should display empty cart message when cart is empty", async ({
    authenticatedPage,
  }) => {
    // given
    await cartMocks.mockEmptyCart(authenticatedPage.page);
    const cartPage = new CartPage(authenticatedPage.page);

    // when
    await cartPage.navigate();

    // then
    await expect(cartPage.cartTitle).toBeVisible();
    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.browseProductsButton).toBeVisible();
  });

  test("should display cart items when cart has items", async ({
    authenticatedPage,
  }) => {
    // given
    await cartMocks.mockCartWithItems(authenticatedPage.page);
    const cartPage = new CartPage(authenticatedPage.page);

    // when
    await cartPage.navigate();

    // then
    await expect(cartPage.cartTitle).toBeVisible();
    await expect(cartPage.cartItemsHeading).toBeVisible();
    await expect(cartPage.cartSummaryHeading).toBeVisible();

    // Verify cart items
    const itemNames = await cartPage.getCartItemNames();
    expect(itemNames).toContain("Test Product 1");
    expect(itemNames).toContain("Test Product 2");

    // Verify prices
    const itemPrices = await cartPage.getCartItemPrices();
    expect(itemPrices.some(price => price.includes("$39.98"))).toBeTruthy();
    expect(itemPrices.some(price => price.includes("$29.99"))).toBeTruthy();

    // Verify cart summary
    expect(await cartPage.getCartTotalItems()).toBe("3");
    expect(await cartPage.getCartTotalPrice()).toBe("$69.97");
  });

  test("should update cart item quantity", async ({ authenticatedPage }) => {
    // given
    const initialCartState = {
      username: "testuser",
      items: [
        {
          productId: 1,
          productName: "Test Product 1",
          quantity: 1,
          unitPrice: 19.99,
          totalPrice: 19.99,
          imageUrl: "test-image-1.jpg"
        },
      ],
      totalPrice: 19.99,
      totalItems: 1,
    };

    await cartMocks.mockCartWithState(authenticatedPage.page, initialCartState);
    await cartMocks.mockUpdateCartState(
      authenticatedPage.page,
      initialCartState
    );
    const cartPage = new CartPage(authenticatedPage.page);
    await cartPage.navigate();

    // when
    await cartPage.updateItemQuantity("Test Product 1", 2);

    // then
    await expect.poll(async () => cartPage.getCartTotalItems()).toBe("2");
    await expect.poll(async () => cartPage.getCartTotalPrice()).toBe("$39.98");
  });

  test("should remove item from cart", async ({ authenticatedPage }) => {
    // given
    const initialCartState = {
      username: "testuser",
      items: [
        {
          productId: 1,
          productName: "Test Product 1",
          quantity: 1,
          unitPrice: 19.99,
          totalPrice: 19.99,
          imageUrl: "test-image-1.jpg"
        },
      ],
      totalPrice: 19.99,
      totalItems: 1,
    };

    await cartMocks.mockCartWithState(authenticatedPage.page, initialCartState);
    await cartMocks.mockRemoveCartItem(
      authenticatedPage.page,
      initialCartState
    );
    const cartPage = new CartPage(authenticatedPage.page);
    await cartPage.navigate();

    // when
    await cartPage.removeItem("Test Product 1");

    // then
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });

  test("should clear cart", async ({ authenticatedPage }) => {
    // given
    const cartState = {
      username: "testuser",
      items: [
        {
          productId: 1,
          productName: "Test Product 1",
          quantity: 1,
          unitPrice: 19.99,
          totalPrice: 19.99,
          imageUrl: "test-image-1.jpg"
        },
      ],
      totalPrice: 19.99,
      totalItems: 1,
    };

    await cartMocks.mockCartForClearTest(authenticatedPage.page, cartState);
    const cartPage = new CartPage(authenticatedPage.page);
    await cartPage.navigate();
    await expect(cartPage.cartTitle).toBeVisible();

    // when
    await cartPage.clearCart();

    // then
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });
});
