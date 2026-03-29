import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { products } from '../../lib/api';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  category?: string;
}

export function ProductList({ category }: ProductListProps) {
  const [sortOption, setSortOption] = useState<string>('name-asc');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: allProducts, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: products.getAllProducts,
  });

  const filteredProducts = useMemo(() => {
    if (!allProducts?.data) return [];

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
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return filtered.sort((a, b) => b.price - a.price);
      default:
        return filtered;
    }
  }, [allProducts, category, searchTerm, sortOption]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const renderSearchAndSort = () => (
    <div
      className="mb-6 rounded-[1.75rem] border border-stone-200/80 bg-white/84 p-5 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]"
      data-testid="product-list-controls"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Browse</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950" data-testid="product-list-title">
            {category ? `${category} Products` : 'All Products'}
          </h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-testid="product-list-filters">
          <div className="relative min-w-[220px] flex-1" data-testid="product-search-container">
          <input
            type="text"
            placeholder="Search products..."
            className="h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition hover:text-slate-700"
              onClick={clearSearch}
              data-testid="clear-search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
          <div className="flex items-center gap-2" data-testid="product-sort-container">
          <label htmlFor="sort" className="text-sm font-medium text-slate-600" data-testid="product-sort-label">Sort by:</label>
          <select
            id="sort"
            className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
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
    </div>
  );

  if (isLoading) {
    return <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center text-slate-500" data-testid="product-list-loading">Loading products...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600" data-testid="error-message">Error loading products</div>;
  }

  if (!filteredProducts.length) {
    return (
      <div data-testid="product-list-empty-container">
        {renderSearchAndSort()}
        <div className="rounded-[1.75rem] border border-stone-200/80 bg-white/84 px-6 py-12 text-center" data-testid="no-products-message">
          <p className="text-lg font-medium text-slate-900 mb-2">No products found</p>
          {searchTerm && (
            <div className="mt-4" data-testid="empty-search-actions">
              <p className="text-sm text-slate-600 mb-3">Try adjusting your search or</p>
              <button 
                onClick={clearSearch}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
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
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="product-list">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 
