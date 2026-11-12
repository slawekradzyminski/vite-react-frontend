import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutPage } from './CheckoutPage';
import { cart, orders } from '../../lib/api';

// Regression for BUG-CHECKOUT-01. React Router commits a navigation inside a transition, so on a
// slow device CheckoutPage is still mounted when the cart refetched after the order arrives empty.
// Its "empty cart" redirect must not override the navigation to the payment page.

const { paymentEnabled } = vi.hoisted(() => ({ paymentEnabled: { value: true } }));

vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  cart: { getCart: vi.fn() },
  orders: { createOrder: vi.fn() },
  products: {
    getProductById: vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Desk lamp', price: 20, imageUrl: '', description: '', stockQuantity: 5, category: 'Home' },
    }),
  },
}));

vi.mock('../../lib/runtimeConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/runtimeConfig')>()),
  isPaymentEnabled: () => paymentEnabled.value,
}));

const filledCart = {
  data: {
    username: 'customer',
    items: [{ productId: 1, productName: 'Desk lamp', quantity: 2, unitPrice: 20, totalPrice: 40, imageUrl: '' }],
    totalPrice: 40,
    totalItems: 2,
  },
};
const emptyCart = { data: { username: 'customer', items: [], totalPrice: 0, totalItems: 0 } };

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

// A destination that is not ready yet: it suspends until the test releases it, which keeps the
// navigation transition pending exactly like a slow device rendering the payment page.
function slowDestination(name: string, gate: { promise: Promise<void>; ready: boolean }) {
  return function SlowDestination() {
    if (!gate.ready) throw gate.promise;
    return <div data-testid={`${name}-destination`}>{name}</div>;
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderCheckout(gate: { promise: Promise<void>; ready: boolean }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const PaymentDestination = slowDestination('payment', gate);
  const OrderDestination = slowDestination('order', gate);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/checkout']}>
        <LocationProbe />
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cart" element={<div data-testid="cart-destination">Your cart is empty</div>} />
          <Route path="/orders/:id/pay" element={<PaymentDestination />} />
          <Route path="/orders/:id" element={<OrderDestination />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function placeOrder() {
  for (const [label, value] of [[/street address/i, 'Main 1'], [/city/i, 'Warsaw'], [/state\/province/i, 'Mazovia'], [/zip\/postal code/i, '00-001'], [/country/i, 'Poland']] as const) {
    fireEvent.change(await screen.findByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByTestId('checkout-submit-button'));
}

describe('CheckoutPage after the order is placed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentEnabled.value = true;
  });

  it.each([
    { payment: true, destination: 'payment', path: '/orders/42/pay', status: 'Order placed. Opening payment…' },
    { payment: false, destination: 'order', path: '/orders/42', status: 'Order placed. Opening your order…' },
  ])('stays on the way to $path when the refetched cart is empty before the next page renders', async ({ payment, destination, path, status }) => {
    // given
    paymentEnabled.value = payment;
    const pending = deferred();
    const gate = { promise: pending.promise, ready: false };
    const cartRefetched = deferred();
    vi.mocked(cart.getCart)
      .mockResolvedValueOnce(filledCart as never)
      .mockImplementation(() => { cartRefetched.resolve(); return Promise.resolve(emptyCart as never); });
    vi.mocked(orders.createOrder).mockResolvedValue({ data: { id: 42 } } as never);
    renderCheckout(gate);

    // when
    await placeOrder();
    await cartRefetched.promise;
    await new Promise((settled) => setTimeout(settled, 50));

    // then
    expect(screen.queryByTestId('cart-destination')).not.toBeInTheDocument();
    expect(screen.getByTestId('checkout-opening-payment')).toHaveTextContent(status);
    expect(screen.getByTestId('location')).toHaveTextContent('/checkout');

    // when the next page is ready
    gate.ready = true;
    pending.resolve();

    // then
    expect(await screen.findByTestId(`${destination}-destination`)).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(path);
    expect(screen.queryByTestId('cart-destination')).not.toBeInTheDocument();
  });

  it('still sends a fresh visit with an empty cart to the cart page', async () => {
    // given
    vi.mocked(cart.getCart).mockResolvedValue(emptyCart as never);

    // when
    renderCheckout({ promise: Promise.resolve(), ready: true });

    // then
    expect(await screen.findByTestId('cart-destination')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/cart');
    expect(orders.createOrder).not.toHaveBeenCalled();
  });

  it('keeps the checkout when the order fails and the cart is still full', async () => {
    // given
    vi.mocked(cart.getCart).mockResolvedValue(filledCart as never);
    vi.mocked(orders.createOrder).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'Out of stock' } } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCheckout({ promise: Promise.resolve(), ready: true });

    // when
    await placeOrder();

    // then
    expect(await screen.findByTestId('checkout-availability-error')).toBeInTheDocument();
    expect(screen.queryByTestId('checkout-opening-payment')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/checkout');
  });
});
