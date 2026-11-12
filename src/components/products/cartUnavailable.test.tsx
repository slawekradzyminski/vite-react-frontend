import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cart, products } from '../../lib/api';
import { authStorage } from '../../lib/authStorage';
import { renderWithRoute } from '../../test/renderWithRoute';
import { ProductCard } from './ProductCard';
import { ProductDetails } from './ProductDetails';

vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  cart: { getCart: vi.fn(), addToCart: vi.fn(), updateCartItem: vi.fn(), removeFromCart: vi.fn() },
  products: { getProductById: vi.fn() },
}));

const product = { id: 1, name: 'Desk Lamp', price: 25, description: 'A lamp', imageUrl: '', category: 'Home', stockQuantity: 10 };
const serverError = Object.assign(new Error('Server Error'), { isAxiosError: true, response: { status: 500, data: {} } });
const cartWithLamp = { data: { username: 'client', items: [{ productId: 1, quantity: 3 }], totalItems: 3, totalPrice: 75 } };

// A failed cart read must not look like an empty cart: "Add to Cart" would then create a
// second line or overwrite the quantity the customer already has.
describe('cart unavailable on product pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authStorage, 'getAccessToken').mockReturnValue('token');
    vi.mocked(products.getProductById).mockResolvedValue({ data: product } as never);
  });

  afterEach(() => vi.restoreAllMocks());

  it('product details warns, disables cart actions and recovers on retry', async () => {
    // given
    vi.mocked(cart.getCart).mockRejectedValueOnce(serverError).mockResolvedValueOnce(cartWithLamp as never);
    const user = userEvent.setup();
    renderWithRoute(<ProductDetails />, { route: '/products/1', path: '/products/:id' });

    // when
    const warning = await screen.findByTestId('product-cart-unavailable');

    // then
    expect(warning).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('add-to-cart')).toBeDisabled();

    // when
    await user.click(screen.getByTestId('product-cart-retry'));

    // then
    await waitFor(() => expect(screen.queryByTestId('product-cart-unavailable')).not.toBeInTheDocument());
    expect(screen.getByTestId('add-to-cart')).toHaveTextContent('Update Cart');
    expect(screen.getByTestId('add-to-cart')).toBeEnabled();
    expect(screen.getByTestId('product-cart-quantity')).toHaveTextContent('3 in cart');
  });

  it('product card warns and disables cart actions until the cart is known', async () => {
    // given
    vi.mocked(cart.getCart).mockRejectedValueOnce(serverError).mockResolvedValueOnce(cartWithLamp as never);
    const user = userEvent.setup();
    renderWithRoute(<ProductCard product={product} />);

    // when
    await screen.findByTestId('product-cart-unavailable');

    // then
    expect(screen.getByTestId('product-add-button')).toBeDisabled();
    expect(cart.addToCart).not.toHaveBeenCalled();

    // when
    await user.click(screen.getByTestId('product-cart-retry'));

    // then
    await waitFor(() => expect(screen.getByTestId('product-add-button')).toHaveTextContent('Update Cart'));
    expect(screen.getByTestId('product-add-button')).toBeEnabled();
    expect(screen.queryByTestId('product-cart-unavailable')).not.toBeInTheDocument();
  });

  it('keeps cart actions available to signed-out visitors', async () => {
    // given
    vi.mocked(authStorage.getAccessToken).mockReturnValue(null);

    // when
    renderWithRoute(<ProductCard product={product} />);

    // then
    expect(screen.getByTestId('product-add-button')).toBeEnabled();
    expect(cart.getCart).not.toHaveBeenCalled();
  });
});
