import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { products } from '../../lib/api';
import { Product } from '../../types/product';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  category?: string;
}

export function ProductList({ category }: ProductListProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState<string>('name-asc');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: allProducts, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: products.getAllProducts,
  });

  useEffect(() => {
    if (!allProducts?.data) return;
    let filtered = [...allProducts.data];
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term)
      );
    }
    
    switch (sortOption) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    
    setFilteredProducts(filtered);
  }, [allProducts, category, sortOption, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const renderSearchAndSort = () => (
    <div className="mb-6 flex justify-between items-center" data-testid="product-list-controls">
      <h2 className="text-2xl font-bold" data-testid="product-list-title">
        {category ? `${category} Products` : 'All Products'}
      </h2>
      <div className="flex items-center space-x-4" data-testid="product-list-filters">
        <div className="relative" data-testid="product-search-container">
          <input
            type="text"
            placeholder="Search products..."
            className="border rounded p-2 pr-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="product-search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clearSearch}
              data-testid="clear-search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center" data-testid="product-sort-container">
          <label htmlFor="sort" className="mr-2" data-testid="product-sort-label">Sort by:</label>
          <select
            id="sort"
            className="border rounded p-2"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            data-testid="product-sort"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8" data-testid="product-list-loading">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500" data-testid="error-message">Error loading products</div>;
  }

  if (!filteredProducts.length) {
    return (
      <div data-testid="product-list-empty-container">
        {renderSearchAndSort()}
        <div className="text-center py-8" data-testid="no-products-message">
          <p className="text-lg mb-2">No products found</p>
          {searchTerm && (
            <div className="mt-4" data-testid="empty-search-actions">
              <p className="text-sm text-gray-600 mb-2">Try adjusting your search or</p>
              <button 
                onClick={clearSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                data-testid="reset-search-button"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="product-list-container">
      {renderSearchAndSort()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="product-list">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 