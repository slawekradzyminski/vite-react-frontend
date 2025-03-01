import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/test-utils";
import { CartItem } from "./CartItem";
import { cart } from "../../lib/api";
import { CartItem as CartItemType } from "../../types/cart";

vi.mock("../../lib/api", () => ({
  cart: {
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
  },
}));

describe("CartItem", () => {
  const mockItem: CartItemType = {
    productId: 1,
    productName: "Test Product",
    quantity: 2,
    unitPrice: 10,
    totalPrice: 20,
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the cart item correctly", () => {
    // when
    renderWithProviders(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // then
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$10.00 each")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("increases quantity when + button is clicked", () => {
    // given
    renderWithProviders(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    const increaseButton = screen.getByText("+");
    fireEvent.click(increaseButton);

    // then
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("decreases quantity when - button is clicked", () => {
    // given
    renderWithProviders(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    const decreaseButton = screen.getByText("-");
    fireEvent.click(decreaseButton);

    // then
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("does not decrease quantity below 1", () => {
    // given
    const itemWithQuantityOne = { ...mockItem, quantity: 1 };
    renderWithProviders(
      <CartItem item={itemWithQuantityOne} onUpdate={mockOnUpdate} />
    );

    // when
    const decreaseButton = screen.getByText("-");
    fireEvent.click(decreaseButton);

    // then
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("Update")).not.toBeInTheDocument();
  });

  it("calls updateCartItem when Update button is clicked", async () => {
    // given
    vi.mocked(cart.updateCartItem).mockResolvedValue({} as any);
    renderWithProviders(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    const increaseButton = screen.getByText("+");
    fireEvent.click(increaseButton);

    const updateButton = screen.getByText("Update");
    fireEvent.click(updateButton);

    // then
    await waitFor(() => {
      expect(cart.updateCartItem).toHaveBeenCalledWith(1, { quantity: 3 });
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it("calls removeFromCart when Remove button is clicked", async () => {
    // given  
    vi.mocked(cart.removeFromCart).mockResolvedValue({} as any);
    renderWithProviders(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    // then
    await waitFor(() => {
      expect(cart.removeFromCart).toHaveBeenCalledWith(1);
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });
});
