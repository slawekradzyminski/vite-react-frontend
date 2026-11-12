import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CartItem } from './CartItem';
import { cart, products } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import { CartItem as CartItemType } from '../../types/cart';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';

vi.mock('../../lib/api', () => ({
  cart: {
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn()
  },
  products: {
    getProductById: vi.fn(),
  },
}));

const mockToast = vi.fn();
vi.mock('../../hooks/useToast', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../hooks/useToast')>()),
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('react-router', () => {
  return {
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
    useLocation: () => ({ pathname: '/cart' }),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    )
  };
});


// Stock returned by the product lookup after a 409.
const STOCK_BY_ID: Record<number, number> = { 31: 3, 32: 3, 35: 3, 36: 3 };

const conflict = (status = 409) =>
  new AxiosError('conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message: 'Insufficient stock for product 32' },
  });

describe("CartItem", () => {
  const mockItem: CartItemType = {
    productId: 1,
    productName: "Test Product",
    quantity: 2,
    unitPrice: 10,
    totalPrice: 20,
    imageUrl: 'test-image.jpg'
  };

  const mockOnUpdate = vi.fn();

  const renderCartItem = (item: CartItemType = mockItem) =>
    renderWithProviders(
      <table>
        <tbody>
          <CartItem item={item} onUpdate={mockOnUpdate} />
        </tbody>
      </table>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(products.getProductById).mockImplementation(async (id: number) => ({
      data: { id, name: `Product ${id}`, price: 10, description: '', category: 'Books', stockQuantity: STOCK_BY_ID[id] ?? 99 },
    }) as AxiosResponse);
  });

  it("renders the cart item correctly", () => {
    // given
    renderCartItem();

    // then
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
  });

  it("tells the shopper the price changed and which price the cart keeps", () => {
    // given
    renderCartItem({ ...mockItem, priceChanged: true, currentPrice: 12.5 });

    // then
    expect(screen.getByTestId('cart-item-price-changed-1')).toHaveTextContent(
      'Price changed: now $12.50. Your cart keeps $10.00 until you update this item.',
    );
    expect(screen.getByRole('status')).toBe(screen.getByTestId('cart-item-price-changed-1'));
  });

  it("shows no price notice for an unchanged price", () => {
    // given
    renderCartItem();

    // then
    expect(screen.queryByTestId('cart-item-price-changed-1')).not.toBeInTheDocument();
  });

  it("increases quantity when + button is clicked", () => {
    // given
    renderCartItem();

    // when
    fireEvent.click(screen.getByText("+"));

    // then
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("decreases quantity when - button is clicked", () => {
    // given
    renderCartItem();

    // when
    fireEvent.click(screen.getByText("-"));

    // then
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("does not decrease quantity below 1", () => {
    // given
    const singleItem = { ...mockItem, quantity: 1 };
    renderCartItem(singleItem);

    // when
    fireEvent.click(screen.getByText("-"));

    // then
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("Update")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease quantity of Test Product" })).toBeDisabled();
  });

  it("names row controls after the product and announces the quantity", () => {
    // given
    renderCartItem();
    const quantity = screen.getByTestId("cart-item-quantity-1");
    const decrease = screen.getByRole("button", { name: "Decrease quantity of Test Product" });

    // when
    fireEvent.click(decrease);

    // then
    expect(screen.getByRole("group", { name: "Quantity of Test Product" })).toContainElement(quantity);
    expect(quantity).toHaveAttribute("aria-live", "polite");
    expect(quantity).toHaveTextContent("1");
    expect(decrease).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase quantity of Test Product" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Update quantity of Test Product" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Test Product from cart" })).toBeInTheDocument();
  });

  it("calls updateCartItem when Update button is clicked", async () => {
    // given
    vi.mocked(cart.updateCartItem).mockImplementation(() => 
      Promise.resolve({
        data: { items: [], totalPrice: 0, totalItems: 0, username: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      } as AxiosResponse)
    );
    renderCartItem();

    // when
    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("Update"));

    // then
    await waitFor(() => {
      expect(cart.updateCartItem).toHaveBeenCalledWith(1, { quantity: 3 });
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it("calls removeFromCart when Remove button is clicked", async () => {
    // given  
    vi.mocked(cart.removeFromCart).mockImplementation(() => 
      Promise.resolve({
        data: { items: [], totalPrice: 0, totalItems: 0, username: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      } as AxiosResponse)
    );
    renderCartItem();

    // when
    fireEvent.click(screen.getByText("Remove"));

    // then
    await waitFor(() => {
      expect(cart.removeFromCart).toHaveBeenCalledWith(1);
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it("resets quantity when item prop changes (simulating parent refresh)", () => {
    // given
    const { rerender } = renderCartItem();
    
    // when - increase quantity
    fireEvent.click(screen.getByText("+"));
    
    // then - quantity should be updated
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    
    // when - parent refreshes with new item data
    const updatedItem = { ...mockItem, quantity: 3, totalPrice: 30 };
    rerender(
      <table>
        <tbody>
          <CartItem item={updatedItem} onUpdate={mockOnUpdate} />
        </tbody>
      </table>
    );
    
    // then - quantity should match new item and Update button should be hidden
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("Update")).not.toBeInTheDocument();
  });

  it("resets to original quantity on API error", async () => {
    // given
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(cart.updateCartItem).mockImplementation(() => 
      Promise.reject(new Error("API Error"))
    );
    renderCartItem();
    
    // when - increase quantity and try to update
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("3")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Update"));
    
    // then - should reset to original quantity after error
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });

  it('stops "+" at the available stock (BUG-007)', async () => {
    // given
    renderCartItem({ ...mockItem, productId: 31, quantity: 2, stockQuantity: 3 });
    const plus = screen.getByTestId('cart-item-increase-31');

    // when
    fireEvent.click(plus); // 2 -> 3
    await waitFor(() => expect(plus).toBeDisabled());
    fireEvent.click(plus);

    // then
    expect(screen.getByTestId('cart-item-quantity-31')).toHaveTextContent('3');
  });

  it('explains a stock conflict instead of silently reverting', async () => {
    // given
    vi.mocked(cart.updateCartItem).mockRejectedValue(conflict());
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCartItem({ ...mockItem, productId: 32, quantity: 2, stockQuantity: 5 });
    fireEvent.click(screen.getByTestId('cart-item-increase-32'));

    // when
    fireEvent.click(screen.getByTestId('cart-item-update-32'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'error',
      description: 'Only 3 left in stock.',
    })));
    expect(products.getProductById).toHaveBeenCalledWith(32);
    expect(screen.getByTestId('cart-item-quantity-32')).toHaveTextContent('2');
  });

  it('caps "+" from the cart data without requesting the product (GraphQL single-query contract)', () => {
    // when
    renderCartItem({ ...mockItem, productId: 37, quantity: 2, stockQuantity: 2 });

    // then
    expect(screen.getByTestId('cart-item-increase-37')).toBeDisabled();
    expect(products.getProductById).not.toHaveBeenCalled();
  });

  it('leaves "+" uncapped when the cart source has no stock', () => {
    // when
    renderCartItem({ ...mockItem, productId: 38, quantity: 2 });

    // then
    expect(screen.getByTestId('cart-item-increase-38')).toBeEnabled();
  });

  it('confirms a saved quantity and a removal with toasts', async () => {
    // given
    vi.mocked(cart.updateCartItem).mockResolvedValue({ data: {} } as AxiosResponse);
    vi.mocked(cart.removeFromCart).mockResolvedValue({ data: {} } as AxiosResponse);
    renderCartItem({ ...mockItem, productId: 33, quantity: 2 });
    fireEvent.click(screen.getByTestId('cart-item-increase-33'));

    // when
    fireEvent.click(screen.getByTestId('cart-item-update-33'));
    await waitFor(() => expect(mockOnUpdate).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId('cart-item-remove-33'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Removed from cart' })));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Cart updated', description: 'Test Product quantity set to 3' }));
  });

  it('reports an unsaved quantity and clears it once in sync', async () => {
    // given
    const onPendingChange = vi.fn();
    renderWithProviders(
      <table>
        <tbody>
          <CartItem item={{ ...mockItem, productId: 34 }} onUpdate={mockOnUpdate} onPendingChange={onPendingChange} />
        </tbody>
      </table>
    );

    // when
    fireEvent.click(screen.getByTestId('cart-item-increase-34'));

    // then
    await waitFor(() => expect(onPendingChange).toHaveBeenLastCalledWith(34, 3));
    fireEvent.click(screen.getByTestId('cart-item-decrease-34'));
    await waitFor(() => expect(onPendingChange).toHaveBeenLastCalledWith(34, null));
  });

  it('keeps the generic message without a stock lookup for other update failures', async () => {
    // given
    vi.mocked(cart.updateCartItem).mockRejectedValue(conflict(500));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCartItem({ ...mockItem, productId: 35, quantity: 1, stockQuantity: 3 });
    fireEvent.click(screen.getByTestId('cart-item-increase-35'));

    // when
    fireEvent.click(screen.getByTestId('cart-item-update-35'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'error',
      description: 'Failed to update cart. Please try again.',
    })));
    expect(products.getProductById).not.toHaveBeenCalled();
  });

  it('explains a failed removal', async () => {
    // given
    vi.mocked(cart.removeFromCart).mockRejectedValue(conflict(404));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCartItem({ ...mockItem, productId: 36 });

    // when
    fireEvent.click(screen.getByTestId('cart-item-remove-36'));

    // then
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'error',
      description: 'This product is no longer available.',
    })));
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
