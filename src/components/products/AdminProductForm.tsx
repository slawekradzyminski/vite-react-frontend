import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { products } from '../../lib/api';
import { ProductCreateDto, ProductUpdateDto } from '../../types/product';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Surface } from '../ui/surface';

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
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="product-form-loading">Loading product data...</Surface>;
  }

  return (
    <Surface as="form" variant="default" padding="lg" onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="product-form">
      <Surface variant="inset" padding="md">
        <Label htmlFor="name">
          Product Name*
        </Label>
        <Input
          id="name"
          type="text"
          className="mt-2"
          error={errors.name?.message as string | undefined}
          {...register('name', { required: 'Product name is required', minLength: 3, maxLength: 100 })}
          data-testid="product-name-input"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-name-error">{errors.name.message || 'Name must be between 3 and 100 characters'}</p>
        )}
      </Surface>

      <Surface variant="inset" padding="md">
        <Label htmlFor="description">
          Description
        </Label>
        <Textarea
          id="description"
          className="mt-2 min-h-[140px]"
          {...register('description', { maxLength: 1000 })}
          data-testid="product-description-input"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-description-error">Description must be less than 1000 characters</p>
        )}
      </Surface>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Surface variant="inset" padding="md">
          <Label htmlFor="price">
            Price*
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            className="mt-2"
            error={errors.price?.message as string | undefined}
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
        </Surface>

        <Surface variant="inset" padding="md">
          <Label htmlFor="stockQuantity">
            Stock Quantity*
          </Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            className="mt-2"
            error={errors.stockQuantity?.message as string | undefined}
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
        </Surface>
      </div>

      <Surface variant="inset" padding="md">
        <Label htmlFor="category">
          Category*
        </Label>
        <Input
          id="category"
          type="text"
          className="mt-2"
          error={errors.category?.message as string | undefined}
          {...register('category', { required: 'Category is required' })}
          data-testid="product-category-input"
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-600" data-testid="product-category-error">{errors.category.message}</p>
        )}
      </Surface>

      <Surface variant="inset" padding="md">
        <Label htmlFor="imageUrl">
          Image URL
        </Label>
        <Input
          id="imageUrl"
          type="text"
          className="mt-2"
          error={errors.imageUrl?.message as string | undefined}
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
      </Surface>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="product-submit-button"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </Surface>
  );
} 
