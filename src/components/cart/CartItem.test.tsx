import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartItem } from './CartItem';
import { CartItem as CartItemType } from '../../types/cart';
import { cart } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';

// Mock the cart API
vi.mock('../../lib/api', () => ({
  cart: {
    updateCartItem: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    removeFromCart: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('CartItem', () => {
  const mockItem: CartItemType = {
    productId: 1,
    productName: 'Test Product',
    quantity: 2,
    unitPrice: 19.99,
    totalPrice: 39.98,
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  it('renders cart item information correctly', () => {
    // given
    renderWithRouter(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // then
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$19.99 each')).toBeInTheDocument();
    expect(screen.getByText('$39.98')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('updates quantity when increment button is clicked', async () => {
    // given
    renderWithRouter(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    // Click the Update button that appears after changing quantity
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    // then
    await waitFor(() => {
      expect(cart.updateCartItem).toHaveBeenCalledWith(1, { quantity: 3 });
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('updates quantity when decrement button is clicked', async () => {
    // given
    renderWithRouter(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '-' }));
    // Click the Update button that appears after changing quantity
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    // then
    await waitFor(() => {
      expect(cart.updateCartItem).toHaveBeenCalledWith(1, { quantity: 1 });
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('does not decrement quantity below 1', async () => {
    // given
    const singleItemMock = { ...mockItem, quantity: 1 };
    renderWithRouter(<CartItem item={singleItemMock} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '-' }));
    
    // then
    // The Update button should not appear since quantity can't go below 1
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
    expect(cart.updateCartItem).not.toHaveBeenCalled();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('removes item when remove button is clicked', async () => {
    // given
    renderWithRouter(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    // then
    await waitFor(() => {
      expect(cart.removeFromCart).toHaveBeenCalledWith(1);
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('disables buttons while updating', async () => {
    // given
    renderWithRouter(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    // then
    expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();
    
    // Wait for the operation to complete
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('disables buttons while removing', async () => {
    // given
    renderWithRouter(<CartItem item={mockItem} onUpdate={mockOnUpdate} />);

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    // then
    expect(screen.getByRole('button', { name: 'Removing...' })).toBeDisabled();
    
    // Wait for the operation to complete
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });
}); 