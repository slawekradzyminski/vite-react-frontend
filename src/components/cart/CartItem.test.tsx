import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CartItem } from './CartItem';
import { cart } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import { CartItem as CartItemType } from '../../types/cart';
import { AxiosResponse } from 'axios';

vi.mock('../../lib/api', () => ({
  cart: {
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn()
  }
}));

vi.mock('react-router-dom', () => {
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
});
