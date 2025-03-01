import { useState } from 'react';
import { ProductList } from '../components/products/ProductList';
import { useQuery } from '@tanstack/react-query';
import { products } from '../lib/api';
import type { Product } from '../types/product';

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
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            {isLoading ? (
              <p className="text-gray-500">Loading categories...</p>
            ) : isError ? (
              <p className="text-red-500">Error loading categories</p>
            ) : categories.length === 0 ? (
              <p className="text-gray-500">No categories found (Total products: {allProducts.length})</p>
            ) : (
              <ul className="space-y-2">
                <li>
                  <button
                    className={`w-full text-left px-2 py-1 rounded ${!selectedCategory ? 'bg-blue-100 text-blue-700' : ''}`}
                    onClick={() => setSelectedCategory(undefined)}
                  >
                    All Products
                  </button>
                </li>
                {categories.map(category => (
                  <li key={category}>
                    <button
                      className={`w-full text-left px-2 py-1 rounded ${selectedCategory === category ? 'bg-blue-100 text-blue-700' : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="md:col-span-3">
          <ProductList category={selectedCategory} />
        </div>
      </div>
    </div>
  );
} 