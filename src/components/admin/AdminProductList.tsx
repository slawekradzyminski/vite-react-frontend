import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { products } from '../../lib/api';
import { Product } from '../../types/product';

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
    return <div className="text-center py-8" data-testid="admin-product-list-loading">Loading products...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8" data-testid="admin-product-list-error">
        <p className="text-red-500 mb-4">Error loading products</p>
      </div>
    );
  }
  
  const productList = data?.data || [];
  
  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="admin-product-list">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" data-testid="admin-product-list-title">Manage Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          data-testid="admin-product-list-add-new"
        >
          Add New Product
        </Link>
      </div>
      
      {productList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center" data-testid="admin-product-list-empty">
          <p className="text-gray-600 mb-4">No products found</p>
          <Link
            to="/admin/products/new"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            data-testid="admin-product-list-empty-add"
          >
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="admin-product-list-table-container">
          <table className="min-w-full divide-y divide-gray-200" data-testid="admin-product-list-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productList.map((product: Product) => (
                <tr key={product.id} data-testid={`admin-product-row-${product.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.imageUrl && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.imageUrl}
                            alt={product.name}
                            data-testid={`admin-product-image-${product.id}`}
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900" data-testid={`admin-product-name-${product.id}`}>
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`admin-product-price-${product.id}`}>
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`admin-product-stock-${product.id}`}>
                    {product.stockQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`admin-product-category-${product.id}`}>
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
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
        </div>
      )}
    </div>
  );
} 