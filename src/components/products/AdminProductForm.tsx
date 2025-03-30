import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { products } from '../../lib/api';
import { ProductCreateDto, ProductUpdateDto } from '../../types/product';

interface AdminProductFormProps {
  productId?: number;
  onSuccess?: () => void;
}

export function AdminProductForm({ productId, onSuccess }: AdminProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const isEditMode = !!productId;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductCreateDto | ProductUpdateDto>();

  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => products.getProductById(Number(productId)),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isEditMode && productData?.data) {
      reset({
        name: productData.data.name,
        description: productData.data.description,
        price: productData.data.price,
        stockQuantity: productData.data.stockQuantity,
        category: productData.data.category,
        imageUrl: productData.data.imageUrl,
      });
    }
  }, [isEditMode, productData, reset]);

  const createMutation = useMutation({
    mutationFn: (data: ProductCreateDto) => products.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      if (onSuccess) onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateDto }) => 
      products.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      if (onSuccess) onSuccess();
    },
  });

  const onSubmit = async (data: ProductCreateDto | ProductUpdateDto) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && productId) {
        await updateMutation.mutateAsync({ id: productId, data });
      } else {
        await createMutation.mutateAsync(data as ProductCreateDto);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingProduct) {
    return <div className="text-center py-4" data-testid="product-form-loading">Loading product data...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="product-form">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name*
        </label>
        <input
          id="name"
          type="text"
          className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} p-2`}
          {...register('name', { required: 'Product name is required', minLength: 3, maxLength: 100 })}
          data-testid="product-name-input"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-name-error">{errors.name.message || 'Name must be between 3 and 100 characters'}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          {...register('description', { maxLength: 1000 })}
          data-testid="product-description-input"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-description-error">Description must be less than 1000 characters</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price*
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            className={`mt-1 block w-full rounded-md border ${errors.price ? 'border-red-500' : 'border-gray-300'} p-2`}
            {...register('price', { 
              required: 'Price is required',
              min: { value: 0.01, message: 'Price must be greater than 0' },
              valueAsNumber: true
            })}
            data-testid="product-price-input"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600" data-testid="product-price-error">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">
            Stock Quantity*
          </label>
          <input
            id="stockQuantity"
            type="number"
            min="0"
            className={`mt-1 block w-full rounded-md border ${errors.stockQuantity ? 'border-red-500' : 'border-gray-300'} p-2`}
            {...register('stockQuantity', { 
              required: 'Stock quantity is required',
              min: { value: 0, message: 'Stock quantity cannot be negative' },
              valueAsNumber: true
            })}
            data-testid="product-stock-input"
          />
          {errors.stockQuantity && (
            <p className="mt-1 text-sm text-red-600" data-testid="product-stock-error">{errors.stockQuantity.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category*
        </label>
        <input
          id="category"
          type="text"
          className={`mt-1 block w-full rounded-md border ${errors.category ? 'border-red-500' : 'border-gray-300'} p-2`}
          {...register('category', { required: 'Category is required' })}
          data-testid="product-category-input"
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-category-error">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
          Image URL
        </label>
        <input
          id="imageUrl"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          {...register('imageUrl', { 
            pattern: {
              value: /^(https?:\/\/.*|)$/,
              message: 'Must be a valid URL or empty'
            }
          })}
          data-testid="product-image-input"
        />
        {errors.imageUrl && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-image-error">{errors.imageUrl.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          disabled={isSubmitting}
          data-testid="product-submit-button"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
} 