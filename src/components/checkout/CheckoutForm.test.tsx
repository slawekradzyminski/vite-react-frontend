import { CommerceGraphQlError } from '../../lib/commerceGraphql';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutForm } from './CheckoutForm';
import { orders } from '../../lib/api';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the orders API
vi.mock('../../lib/api', async () => ({
  ...(await import('../../test/commerceApiMocks')).commerceApiMocks(),
  orders: {
    createOrder: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  },
}));

const { mockNavigate, paymentEnabled } = vi.hoisted(() => ({ mockNavigate: vi.fn(), paymentEnabled: { value: true } }));

// Mock react-router hooks
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/runtimeConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/runtimeConfig')>()),
  isPaymentEnabled: () => paymentEnabled.value,
}));

describe('CheckoutForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    paymentEnabled.value = true;
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithProviders = (cartTotal = 99.99) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CheckoutForm cartTotal={cartTotal} />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders checkout form correctly', () => {
    // given
    renderWithProviders();

    // then
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state\/province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip\/postal code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('submits form with shipping address when all fields are filled', async () => {
    // given
    renderWithProviders();

    // when
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/state\/province/i), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/zip\/postal code/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Test Country' } });
    
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    // then
    await waitFor(() => {
      expect(orders.createOrder).toHaveBeenCalledWith({
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country',
      }, expect.stringMatching(/^[0-9a-f-]{36}$/));
    });
  });

  it('shows validation errors when form is submitted with empty fields', async () => {
    // given
    renderWithProviders();

    // when
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    // then
    await waitFor(() => {
      expect(screen.getByText(/street address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/city is required/i)).toBeInTheDocument();
      expect(screen.getByText(/state is required/i)).toBeInTheDocument();
      expect(screen.getByText(/zip code is required/i)).toBeInTheDocument();
      expect(screen.getByText(/country is required/i)).toBeInTheDocument();
    });
    
    expect(orders.createOrder).not.toHaveBeenCalled();
  });

  it('disables the submit button when cart total is 0', () => {
    // given
    renderWithProviders(0);

    // then
    expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled();
  });

  it('disables the submit button while submitting', async () => {
    // given
    const createOrderMock = vi.mocked(orders.createOrder);
    type MutationResult = Awaited<ReturnType<typeof orders.createOrder>>;
    let resolveMutation: ((value: MutationResult) => void) | undefined;
    createOrderMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve;
        })
    );

    renderWithProviders();

    // when
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/state\/province/i), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/zip\/postal code/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Test Country' } });
    
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    // then - intermediate submitting state
    const submitButton = await screen.findByTestId('checkout-submit-button');
    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/processing/i);
      expect(submitButton).toBeDisabled();
    });

    // resolve mutation
    if (!resolveMutation) {
      throw new Error('Mutation resolver was not set');
    }
    resolveMutation({
      data: { id: 1 } as any,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/place order/i);
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('explains a coupon that stopped qualifying instead of blaming stock', async () => {
    vi.mocked(orders.createOrder).mockRejectedValueOnce(Object.assign(new Error('coupon conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { message: 'Applied coupon is no longer valid: Coupon has expired' } },
    }));
    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/state\/province/i), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/zip\/postal code/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Test Country' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    const message = await screen.findByTestId('checkout-availability-error');
    expect(message).toHaveTextContent('Applied coupon is no longer valid: Coupon has expired');
    expect(message).not.toHaveTextContent('no longer available in the requested quantity');
  });

  it('reuses one idempotency key when the same checkout is submitted again', async () => {
    vi.mocked(orders.createOrder).mockRejectedValueOnce(new Error('timeout'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/state\/province/i), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/zip\/postal code/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Test Country' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));
    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));
    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(2));

    const keys = vi.mocked(orders.createOrder).mock.calls.map((call) => call[1]);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    alertSpy.mockRestore();
  });

  it.each([
    Object.assign(new Error('inventory conflict'), { isAxiosError: true, response: { status: 409 } }),
    new CommerceGraphQlError([{ message: 'Stock unavailable', extensions: { code: 'CONFLICT' } }]),
  ])('shows an inline conflict and preserves the cart for %s', async conflict => {
    // given
    vi.mocked(orders.createOrder).mockRejectedValueOnce(conflict);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/state\/province/i), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/zip\/postal code/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Test Country' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByTestId('checkout-availability-error')).toHaveTextContent(
      'Your cart was preserved'
    );
    expect(alertSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
    expect(screen.getByLabelText(/street address/i)).toHaveValue('123 Test St');

    alertSpy.mockRestore();
  });

  it.each([
    [true, '/orders/1/pay'],
    [false, '/orders/1'],
  ])('with payments enabled=%s sends the new PENDING order to %s', async (enabled, target) => {
    // given
    paymentEnabled.value = enabled;
    vi.mocked(orders.createOrder).mockResolvedValueOnce({ data: { id: 1 } } as never);
    renderWithProviders();

    // when
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Test City' } });
    fireEvent.change(screen.getByLabelText(/state\/province/i), { target: { value: 'Test State' } });
    fireEvent.change(screen.getByLabelText(/zip\/postal code/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Test Country' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    // then
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(target, { replace: true }));
  });

  it.each([
    [{ data: { id: 7 } }, '/orders/7/pay'],
    [{ data: {} }, '/orders'],
  ])('tells the page the order was placed, then navigates, before the emptied cart is refetched (%j)', async (response, target) => {
    // given
    const calls: string[] = [];
    const onOrderPlaced = vi.fn(() => { calls.push('placed'); });
    mockNavigate.mockImplementation((to: string) => { calls.push(`navigate ${to}`); });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async (filters) => {
      calls.push(`invalidate ${JSON.stringify(filters?.queryKey)}`);
    });
    vi.mocked(orders.createOrder).mockResolvedValueOnce(response as never);
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CheckoutForm cartTotal={40} onOrderPlaced={onOrderPlaced} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // when
    for (const [label, value] of [[/street address/i, 'Main 1'], [/city/i, 'Warsaw'], [/state\/province/i, 'Mazovia'], [/zip\/postal code/i, '00-001'], [/country/i, 'Poland']] as const) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    // then
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(target, { replace: true }));
    expect(onOrderPlaced).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['placed', `navigate ${target}`, 'invalidate ["cart"]', 'invalidate ["orders"]', 'invalidate ["products"]', 'invalidate ["inventory"]']);
    invalidate.mockRestore();
  });

  it('does not report a placed order when the order fails', async () => {
    // given
    const onOrderPlaced = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(orders.createOrder).mockRejectedValueOnce(new CommerceGraphQlError([{ message: 'Not enough stock', extensions: { code: 'CONFLICT' } }]));
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CheckoutForm cartTotal={40} onOrderPlaced={onOrderPlaced} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // when
    for (const [label, value] of [[/street address/i, 'Main 1'], [/city/i, 'Warsaw'], [/state\/province/i, 'Mazovia'], [/zip\/postal code/i, '00-001'], [/country/i, 'Poland']] as const) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    // then
    expect(await screen.findByTestId('checkout-availability-error')).toBeInTheDocument();
    expect(onOrderPlaced).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
