import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orders } from '../../lib/api';
import { AddressDto } from '../../types/order';

interface CheckoutFormProps {
  cartTotal: number;
}

export function CheckoutForm({ cartTotal }: CheckoutFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<AddressDto>({
    defaultValues: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    }
  });
  
  const createOrderMutation = useMutation({
    mutationFn: (shippingAddress: AddressDto) => orders.createOrder(shippingAddress),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (response?.data?.id) {
        navigate(`/orders/${response.data.id}`);
      } else {
        navigate('/orders');
      }
    },
  });
  
  const onSubmit = async (data: AddressDto) => {
    if (cartTotal <= 0) {
      alert('Your cart is empty. Please add items to your cart before checking out.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createOrderMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6" data-testid="checkout-form-container">
      <h2 className="text-xl font-semibold mb-4" data-testid="checkout-form-title">Shipping Information</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="checkout-form">
        <div data-testid="checkout-street-field">
          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1" data-testid="checkout-street-label">
            Street Address
          </label>
          <input
            id="street"
            type="text"
            className={`w-full p-2 border rounded ${errors.street ? 'border-red-500' : 'border-gray-300'}`}
            {...register('street', { required: 'Street address is required' })}
            data-testid="checkout-street-input"
          />
          {errors.street && (
            <p className="text-red-500 text-sm mt-1" data-testid="checkout-street-error">{errors.street.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="checkout-city-state-row">
          <div data-testid="checkout-city-field">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1" data-testid="checkout-city-label">
              City
            </label>
            <input
              id="city"
              type="text"
              className={`w-full p-2 border rounded ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
              {...register('city', { required: 'City is required' })}
              data-testid="checkout-city-input"
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1" data-testid="checkout-city-error">{errors.city.message}</p>
            )}
          </div>
          
          <div data-testid="checkout-state-field">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1" data-testid="checkout-state-label">
              State/Province
            </label>
            <input
              id="state"
              type="text"
              className={`w-full p-2 border rounded ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              {...register('state', { required: 'State is required' })}
              data-testid="checkout-state-input"
            />
            {errors.state && (
              <p className="text-red-500 text-sm mt-1" data-testid="checkout-state-error">{errors.state.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="checkout-zip-country-row">
          <div data-testid="checkout-zip-field">
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1" data-testid="checkout-zip-label">
              ZIP/Postal Code
            </label>
            <input
              id="zipCode"
              type="text"
              className={`w-full p-2 border rounded ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
              {...register('zipCode', { required: 'ZIP code is required' })}
              data-testid="checkout-zip-input"
            />
            {errors.zipCode && (
              <p className="text-red-500 text-sm mt-1" data-testid="checkout-zip-error">{errors.zipCode.message}</p>
            )}
          </div>
          
          <div data-testid="checkout-country-field">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1" data-testid="checkout-country-label">
              Country
            </label>
            <input
              id="country"
              type="text"
              className={`w-full p-2 border rounded ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
              {...register('country', { required: 'Country is required' })}
              data-testid="checkout-country-input"
            />
            {errors.country && (
              <p className="text-red-500 text-sm mt-1" data-testid="checkout-country-error">{errors.country.message}</p>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200" data-testid="checkout-summary">
          <div className="flex justify-between items-center mb-4" data-testid="checkout-total">
            <span className="font-semibold" data-testid="checkout-total-label">Order Total:</span>
            <span className="font-bold text-lg" data-testid="checkout-total-amount">${cartTotal.toFixed(2)}</span>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={isSubmitting || cartTotal <= 0}
            data-testid="checkout-submit-button"
          >
            {isSubmitting ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
} 