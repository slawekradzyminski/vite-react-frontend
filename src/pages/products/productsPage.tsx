import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { ProductList } from '../../components/products/ProductList';
import { useQuery } from '@tanstack/react-query';
import { products } from '../../lib/api';
import type { Product } from '../../types/product';
import { Surface } from '../../components/ui/surface';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { commerceTransport } from '../../lib/commerceTransport';
import { ProductSearch } from '../../components/products/ProductSearch';
import { ProductsHero } from '../../components/products/ProductsHero';

export function ProductsPage() {
  useDocumentTitle('Products');
  // REST searches on the server; GraphQL keeps filtering the full catalogue in the browser.
  return commerceTransport === 'rest' ? <ProductSearch /> : <CatalogProductsPage />;
}

function CatalogProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') ?? undefined;
  const setSelectedCategory = useCallback((category: string | undefined) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (category) {
        next.set('category', category);
      } else {
        next.delete('category');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  
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
      <ProductsHero summary={`${allProducts.length} products across ${categories.length || 1} categories`} />

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
                  <li data-testid="products-category-item-all">
                    <button
                      className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                        !selectedCategory
                          ? 'bg-slate-900 text-stone-50 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)]'
                          : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                      }`}
                      onClick={() => setSelectedCategory(undefined)}
                      aria-pressed={!selectedCategory}
                      data-testid="products-category-all"
                    >
                      All Products
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category} data-testid={`products-category-item-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                      <button
                        className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                          selectedCategory === category
                            ? 'bg-slate-900 text-stone-50 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)]'
                            : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                        }`}
                        onClick={() => setSelectedCategory(category)}
                        aria-pressed={selectedCategory === category}
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
