import { useState } from 'react';
import { ProductList } from '../../components/products/ProductList';
import { useQuery } from '@tanstack/react-query';
import { products } from '../../lib/api';
import type { Product } from '../../types/product';
import { Surface } from '../../components/ui/surface';

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
    <div className="space-y-6 pb-10" data-testid="products-page">
      <Surface
        as="section"
        variant="hero"
        padding="xl"
        data-testid="products-hero"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Catalog</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="products-title">
              Products
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Browse the live assortment, narrow by category, and move directly into product detail or cart actions.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
            {allProducts.length} products across {categories.length || 1} categories
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]" data-testid="products-layout">
        <aside className="xl:sticky xl:top-24 xl:self-start" data-testid="products-sidebar">
          <Surface variant="muted" padding="md" data-testid="products-categories-container">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Filter</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950" data-testid="products-categories-title">Categories</h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-slate-500" data-testid="products-categories-loading">Loading categories...</p>
            ) : isError ? (
              <p className="mt-4 text-sm text-red-600" data-testid="products-categories-error">Error loading categories</p>
            ) : categories.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500" data-testid="products-categories-empty">No categories found (Total products: {allProducts.length})</p>
            ) : (
              <div className="mt-5" data-testid="product-filter-category">
                <ul className="space-y-2" data-testid="products-categories-list">
                  <li>
                    <button
                      className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                        !selectedCategory
                          ? 'bg-slate-900 text-stone-50 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)]'
                          : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                      }`}
                      onClick={() => setSelectedCategory(undefined)}
                      data-testid="products-category-all"
                    >
                      All Products
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category}>
                      <button
                        className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                          selectedCategory === category
                            ? 'bg-slate-900 text-stone-50 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)]'
                            : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                        }`}
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
          </Surface>
        </aside>
        
        <div className="min-w-0" data-testid="products-content">
          <ProductList category={selectedCategory} />
        </div>
      </div>
    </div>
  );
} 
