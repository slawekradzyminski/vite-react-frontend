import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutForm } from './CheckoutForm';
import { orders } from '../../lib/api';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the orders API
vi.mock('../../lib/api', () => ({
  orders: {
    createOrder: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  },
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('CheckoutForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
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
      });
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
}); 
