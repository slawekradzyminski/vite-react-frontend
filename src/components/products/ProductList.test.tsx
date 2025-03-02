import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import { ProductList } from './ProductList';
import { products } from '../../lib/api';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../lib/api', () => ({
  products: {
    getAllProducts: vi.fn(),
  },
}));

vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }) => (
    <div data-testid={`product-card-${product.id}`}>
      <h3>{product.name}</h3>
      <p>${product.price.toFixed(2)}</p>
      <p>{product.category}</p>
    </div>
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

import { useQuery } from '@tanstack/react-query';

describe('ProductList', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description 1',
      price: 10.99,
      stockQuantity: 5,
      category: 'Electronics',
      imageUrl: 'image1.jpg',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description 2',
      price: 20.99,
      stockQuantity: 10,
      category: 'Books',
      imageUrl: 'image2.jpg',
      createdAt: '2023-01-02',
      updatedAt: '2023-01-02',
    },
    {
      id: 3,
      name: 'Product 3',
      description: 'Description 3',
      price: 15.99,
      stockQuantity: 8,
      category: 'Electronics',
      imageUrl: 'image3.jpg',
      createdAt: '2023-01-03',
      updatedAt: '2023-01-03',
    },
    {
      id: 4,
      name: 'Phone X',
      description: 'A smartphone',
      price: 599.99,
      stockQuantity: 15,
      category: 'Electronics',
      imageUrl: 'phone.jpg',
      createdAt: '2023-01-04',
      updatedAt: '2023-01-04',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (products.getAllProducts as any).mockResolvedValue({ data: mockProducts });
    
    (useQuery as any).mockReturnValue({
      data: { data: mockProducts },
      isLoading: false,
      error: null,
    });
  });

  const renderProductList = (props = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductList {...props} />
      </QueryClientProvider>
    );
  };

  it('renders all products when no category is selected', async () => {
    // given
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    // then
    expect(screen.getByText(/All Products/i)).toBeInTheDocument();
    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
  });

  it('filters products by search term', async () => {
    // given
    const user = userEvent.setup();
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByTestId('product-search');
    await user.type(searchInput, 'phone');
    await user.keyboard('{Enter}');
    
    // then
    expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
  });

  it('filters products by category when category is provided', async () => {
    // given
    renderProductList({ category: 'Electronics' });
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    // then
    expect(screen.getByText(/Electronics Products/i)).toBeInTheDocument();
    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
    expect(screen.queryByTestId('product-card-2')).not.toBeInTheDocument();
  });

  it('sorts products by name in ascending order by default', async () => {
    // given
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    // then
    const productCards = screen.getAllByTestId(/product-card-/);
    expect(productCards[0]).toHaveTextContent('Phone X');
    expect(productCards[1]).toHaveTextContent('Product 1');
    expect(productCards[2]).toHaveTextContent('Product 2');
    expect(productCards[3]).toHaveTextContent('Product 3');
  });

  it('sorts products by price when sort option is changed', async () => {
    // given
    const user = userEvent.setup();
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    const sortSelect = screen.getByLabelText('Sort by:');
    await user.selectOptions(sortSelect, 'price-desc');
    
    // then
    const productCards = screen.getAllByTestId(/product-card-/);
    expect(productCards[0]).toHaveTextContent('Phone X'); // $599.99
    expect(productCards[1]).toHaveTextContent('Product 2'); // $20.99
    expect(productCards[2]).toHaveTextContent('Product 3'); // $15.99
    expect(productCards[3]).toHaveTextContent('Product 1'); // $10.99
  });

  it('displays loading state while fetching products', () => {
    // given
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    // when
    renderProductList();
    
    // then
    expect(screen.getByText(/Loading products/i)).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    // given
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });
    
    // when
    renderProductList();
    
    // then
    expect(screen.getByText(/Error loading products/i)).toBeInTheDocument();
  });

  it('displays no products found message when filtered results are empty', async () => {
    // given
    renderProductList({ category: 'NonExistentCategory' });
    
    // then
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
      expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });
  });

  it('keeps search bar visible when no products match search term', async () => {
    // given
    const user = userEvent.setup();
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByTestId('product-search');
    await user.type(searchInput, 'nonexistentproduct');
    await user.keyboard('{Enter}');
    
    // then
    expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    expect(screen.getByTestId('product-search')).toBeInTheDocument();
    expect(screen.getByTestId('product-sort')).toBeInTheDocument();
    expect(screen.getByTestId('reset-search-button')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search or/i)).toBeInTheDocument();
  });

  it('clears search when reset search button is clicked', async () => {
    // given
    const user = userEvent.setup();
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    // Search for a non-existent product
    const searchInput = screen.getByTestId('product-search');
    await user.type(searchInput, 'nonexistentproduct');
    await user.keyboard('{Enter}');
    
    // Verify no products are found
    expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    
    // Click the reset search button
    const resetButton = screen.getByTestId('reset-search-button');
    await user.click(resetButton);
    
    // then
    // Verify all products are shown again
    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
    });
    
    // Verify search input is cleared
    expect(searchInput).toHaveValue('');
  });

  it('shows clear search button (X) when search has text and clears on click', async () => {
    // given
    const user = userEvent.setup();
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    // Type in the search input
    const searchInput = screen.getByTestId('product-search');
    await user.type(searchInput, 'phone');
    
    // Verify clear button appears
    const clearButton = screen.getByTestId('clear-search');
    expect(clearButton).toBeInTheDocument();
    
    // Click the clear button
    await user.click(clearButton);
    
    // then
    // Verify search input is cleared
    expect(searchInput).toHaveValue('');
    
    // Verify all products are shown again
    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
    });
    
    // Verify clear button is no longer visible
    expect(screen.queryByTestId('clear-search')).not.toBeInTheDocument();
  });

  it('filters products by search term in description', async () => {
    // given
    const user = userEvent.setup();
    renderProductList();
    
    // when
    await waitFor(() => {
      expect(useQuery).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByTestId('product-search');
    await user.type(searchInput, 'smartphone');
    await user.keyboard('{Enter}');
    
    // then
    expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-card-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('product-card-4')).toBeInTheDocument();
  });
}); 