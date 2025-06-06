import { useState } from 'react';
import { ProductList } from '../../components/products/ProductList';
import { useQuery } from '@tanstack/react-query';
import { products } from '../../lib/api';
import type { Product } from '../../types/product';

export function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: products.getAllProducts,
  });
  
  const allProducts = data?.data && Array.isArray(data.data) ? data.data : [];
  
  const categories = [...new Set(allProducts.map((product: Product) => product.category))]
    .filter(Boolean)
    .sort();
  
  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="products-page">
      <h1 className="text-2xl font-bold mb-6" data-testid="products-title">Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="products-layout">
        <div className="md:col-span-1" data-testid="products-sidebar">
          <div className="bg-white rounded-lg shadow-sm p-4" data-testid="products-categories-container">
            <h2 className="text-lg font-semibold mb-4" data-testid="products-categories-title">Categories</h2>
            {isLoading ? (
              <p className="text-gray-500" data-testid="products-categories-loading">Loading categories...</p>
            ) : isError ? (
              <p className="text-red-500" data-testid="products-categories-error">Error loading categories</p>
            ) : categories.length === 0 ? (
              <p className="text-gray-500" data-testid="products-categories-empty">No categories found (Total products: {allProducts.length})</p>
            ) : (
              <div data-testid="product-filter-category">
                <ul className="space-y-2" data-testid="products-categories-list">
                  <li>
                    <button
                      className={`w-full text-left px-2 py-1 rounded ${!selectedCategory ? 'bg-blue-100 text-blue-700' : ''}`}
                      onClick={() => setSelectedCategory(undefined)}
                      data-testid="products-category-all"
                    >
                      All Products
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category}>
                      <button
                        className={`w-full text-left px-2 py-1 rounded ${selectedCategory === category ? 'bg-blue-100 text-blue-700' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                        value={category}
                        data-testid={`products-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-3" data-testid="products-content">
          <ProductList category={selectedCategory} />
        </div>
      </div>
    </div>
  );
} 