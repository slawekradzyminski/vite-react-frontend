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

  const { data: allProducts, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: products.getAllProducts,
  });

  useEffect(() => {
    if (!allProducts?.data) return;

    let filtered = [...allProducts.data];
    
    // Filter by category if provided
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }
    
    // Apply sorting
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
  }, [allProducts, category, sortOption]);

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading products</div>;
  }

  if (!filteredProducts.length) {
    return <div className="text-center py-8">No products found</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {category ? `${category} Products` : 'All Products'}
        </h2>
        <div className="flex items-center">
          <label htmlFor="sort" className="mr-2">Sort by:</label>
          <select
            id="sort"
            className="border rounded p-2"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 