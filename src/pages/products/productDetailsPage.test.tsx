import { screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductDetailsPage } from './productDetailsPage';
import { renderWithProviders } from '../../test/test-utils';

// Mock the ProductDetails component
vi.mock('../../components/products/ProductDetails', () => ({
  ProductDetails: vi.fn(() => (
    <div data-testid="product-details-mock">Product Details Component</div>
  ))
}));

describe('ProductDetailsPage', () => {
  // given
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product details page container', () => {
    // when
    renderWithProviders(<ProductDetailsPage />);
    
    // then
    expect(screen.getByTestId('product-details-page')).toBeInTheDocument();
    expect(screen.getByTestId('product-details-page')).toHaveClass('container mx-auto px-4 py-8');
  });

  it('renders the ProductDetails component', () => {
    // when
    renderWithProviders(<ProductDetailsPage />);
    
    // then
    expect(screen.getByTestId('product-details-mock')).toBeInTheDocument();
    expect(screen.getByText('Product Details Component')).toBeInTheDocument();
  });
}); 