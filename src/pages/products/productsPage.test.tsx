import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductsPage } from './productsPage';
import { products } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';
import * as tanstackReactQuery from '@tanstack/react-query';
import { Product } from '../../types/product';

// Mock the products API
vi.mock('../../lib/api', () => ({
  products: {
    getAllProducts: vi.fn(),
  }
}));

// Create a mock for the ProductList component
const mockProductList = vi.fn().mockImplementation(({ category }) => (
  <div data-testid="product-list-mock">
    {category ? `Filtered by: ${category}` : 'All products'}
  </div>
));

// Mock the ProductList component
vi.mock('../../components/products/ProductList', () => ({
  ProductList: (props) => mockProductList(props)
}));

// Mock React Query useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn()
  };
});

describe('ProductsPage', () => {
  // given
  let user;
  const mockProducts: Product[] = [
    { 
      id: 1, 
      name: 'Product 1', 
      price: 10, 
      category: 'Electronics', 
      description: 'First product',
      stockQuantity: 100,
      imageUrl: 'http://example.com/image1.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: 'Product 2', 
      price: 20, 
      category: 'Home', 
      description: 'Second product',
      stockQuantity: 50,
      imageUrl: 'http://example.com/image2.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: 'Product 3', 
      price: 30, 
      category: 'Electronics', 
      description: 'Third product',
      stockQuantity: 75,
      imageUrl: 'http://example.com/image3.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 4, 
      name: 'Product 4', 
      price: 40, 
      category: 'Office', 
      description: 'Fourth product',
      stockQuantity: 25,
      imageUrl: 'http://example.com/image4.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
  ];

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    vi.mocked(products.getAllProducts).mockResolvedValue({
      data: mockProducts,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });
    
    // Default to successful data fetch
    vi.mocked(tanstackReactQuery.useQuery).mockReturnValue({
      data: {
        data: mockProducts
      },
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the products page with title', async () => {
    // when
    renderWithProviders(<ProductsPage />);
    
    // then
    expect(screen.getByTestId('products-page')).toBeInTheDocument();
    expect(screen.getByTestId('products-title')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByTestId('products-layout')).toBeInTheDocument();
    expect(screen.getByTestId('products-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('products-content')).toBeInTheDocument();
    
    // Wait for the categories to load
    await waitFor(() => {
      expect(screen.getByTestId('products-categories-list')).toBeInTheDocument();
    });
  });

  it('displays loading state when fetching products', async () => {
    // given
    vi.mocked(tanstackReactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);
    
    // when
    renderWithProviders(<ProductsPage />);
    
    // then
    expect(screen.getByTestId('products-categories-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });

  it('displays error state when product fetch fails', async () => {
    // given
    vi.mocked(tanstackReactQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch')
    } as any);
    
    // when
    renderWithProviders(<ProductsPage />);
    
    // then
    expect(screen.getByTestId('products-categories-error')).toBeInTheDocument();
    expect(screen.getByText('Error loading categories')).toBeInTheDocument();
  });

  it('displays empty state when no products are found', async () => {
    // given
    vi.mocked(tanstackReactQuery.useQuery).mockReturnValue({
      data: {
        data: []
      },
      isLoading: false,
      isError: false,
    } as any);
    
    // when
    renderWithProviders(<ProductsPage />);
    
    // then
    expect(screen.getByTestId('products-categories-empty')).toBeInTheDocument();
    expect(screen.getByText('No categories found (Total products: 0)')).toBeInTheDocument();
  });

  it('displays categories and filters products', async () => {
    // when
    renderWithProviders(<ProductsPage />);
    
    // Wait for the categories to load
    await waitFor(() => {
      expect(screen.getByTestId('products-categories-list')).toBeInTheDocument();
    });
    
    // Verify the ProductList is rendered initially with no category
    await waitFor(() => {
      expect(mockProductList).toHaveBeenCalledWith(expect.objectContaining({ 
        category: undefined 
      }));
    });
    
    // Verify categories are displayed
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Office')).toBeInTheDocument();
    
    // Click on a category
    const electronicsCategory = screen.getByTestId('products-category-electronics');
    await user.click(electronicsCategory);
    
    // Verify ProductList is called with the selected category
    expect(mockProductList).toHaveBeenCalledWith(expect.objectContaining({ 
      category: 'Electronics' 
    }));
  });

  it('highlights the selected category', async () => {
    // when
    renderWithProviders(<ProductsPage />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByTestId('products-categories-list')).toBeInTheDocument();
    });
    
    // Initially "All Products" should be highlighted
    const allProductsButton = screen.getByTestId('products-category-all');
    expect(allProductsButton.className).toContain('bg-blue-100');
    
    // Click on a category
    const electronicsCategory = screen.getByTestId('products-category-electronics');
    await user.click(electronicsCategory);
    
    // then
    expect(electronicsCategory.className).toContain('bg-blue-100');
    expect(allProductsButton.className).not.toContain('bg-blue-100');
  });

  it('displays all categories from products', async () => {
    // when
    renderWithProviders(<ProductsPage />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByTestId('products-categories-list')).toBeInTheDocument();
    });
    
    // Verify all product categories are shown
    expect(screen.getByText('All Products')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Office')).toBeInTheDocument();
  });
}); 