import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { products } from '../../lib/api';
import { Product } from '../../types/product';
import { Surface } from '../ui/surface';

export function AdminProductList() {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: products.getAllProducts,
  });
  
  const deleteMutation = useMutation({
    mutationFn: (productId: number) => products.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
  
  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setIsDeleting(productId);
    try {
      await deleteMutation.mutateAsync(productId);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };
  
  if (isLoading) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="admin-product-list-loading">Loading products...</Surface>;
  }
  
  if (error) {
    return (
      <Surface variant="danger" padding="message" className="text-center" data-testid="admin-product-list-error">
        <p className="mb-4 text-red-500">Error loading products</p>
      </Surface>
    );
  }
  
  const productList = data?.data || [];
  
  return (
    <div className="space-y-6 pb-10" data-testid="admin-product-list">
      <Surface as="section" variant="hero" padding="xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="admin-product-list-title">Manage Products</h1>
          </div>
        <Link
          to="/admin/products/new"
          className="w-fit rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          data-testid="admin-product-list-add-new"
        >
          Add New Product
        </Link>
        </div>
      </Surface>
      
      {productList.length === 0 ? (
        <Surface variant="default" className="p-8 text-center" data-testid="admin-product-list-empty">
          <p className="mb-4 text-slate-600">No products found</p>
          <Link
            to="/admin/products/new"
            className="inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
            data-testid="admin-product-list-empty-add"
          >
            Add Your First Product
          </Link>
        </Surface>
      ) : (
        <Surface variant="default" className="overflow-hidden" data-testid="admin-product-list-table-container">
          <table className="min-w-full divide-y divide-stone-200" data-testid="admin-product-list-table">
            <thead className="bg-stone-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white/60">
              {productList.map((product: Product) => (
                <tr key={product.id} data-testid={`admin-product-row-${product.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {product.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.imageUrl && (
                        <div className="shrink-0 h-10 w-10 mr-4">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.imageUrl}
                            alt={product.name}
                            data-testid={`admin-product-image-${product.id}`}
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900" data-testid={`admin-product-name-${product.id}`}>
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`admin-product-price-${product.id}`}>
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`admin-product-stock-${product.id}`}>
                    {product.stockQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`admin-product-category-${product.id}`}>
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="mr-4 text-sky-700 hover:text-sky-900"
                      data-testid={`admin-product-edit-${product.id}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting === product.id}
                      data-testid={`admin-product-delete-${product.id}`}
                    >
                      {isDeleting === product.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
    </div>
  );
} 
