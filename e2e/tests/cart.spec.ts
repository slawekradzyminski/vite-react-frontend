import { test, expect } from "../fixtures/auth.fixture";
import { cartMocks, type CartFixture } from "../mocks/cartMocks";
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

  test("should tell the shopper a cart line price changed", async ({ authenticatedPage }) => {
    // given
    await cartMocks.mockCartWithState(authenticatedPage.page, {
      username: "testuser",
      items: [{ productId: 1, name: "Test Product 1", quantity: 2, unitPrice: 10, currentPrice: 12.5 }],
    });
    const cartPage = new CartPage(authenticatedPage.page);

    // when
    await cartPage.navigate();

    // then
    await expect(authenticatedPage.page.getByTestId("cart-item-price-changed-1")).toHaveText(
      "Price changed: now $12.50. Your cart keeps $10.00 until you update this item.",
    );
    expect(await cartPage.getCartTotalPrice()).toBe("$20.00");
  });

  test("should update cart item quantity", async ({ authenticatedPage }) => {
    // given
    const initialCartState: CartFixture = {
      username: "testuser",
      items: [
        {
          productId: 1,
          name: "Test Product 1",
          quantity: 1,
          unitPrice: 19.99,
          imageUrl: "test-image-1.jpg"
        },
      ],
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
    const initialCartState: CartFixture = {
      username: "testuser",
      items: [
        {
          productId: 1,
          name: "Test Product 1",
          quantity: 1,
          unitPrice: 19.99,
          imageUrl: "test-image-1.jpg"
        },
      ],
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
    const cartState: CartFixture = {
      username: "testuser",
      items: [
        {
          productId: 1,
          name: "Test Product 1",
          quantity: 1,
          unitPrice: 19.99,
          imageUrl: "test-image-1.jpg"
        },
      ],
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
