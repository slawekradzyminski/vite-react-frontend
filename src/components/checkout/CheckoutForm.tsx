import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orders } from '../../lib/api';
import { AddressDto } from '../../types/order';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Surface } from '../ui/surface';

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
    <div data-testid="checkout-form-container">
      <h2 className="mb-4 text-xl font-semibold text-slate-950" data-testid="checkout-form-title">Shipping Information</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="checkout-form">
        <Surface variant="inset" padding="md" data-testid="checkout-street-field">
          <Label htmlFor="street" data-testid="checkout-street-label">
            Street Address
          </Label>
          <Input
            id="street"
            type="text"
            className="mt-2"
            {...register('street', { required: 'Street address is required' })}
            error={errors.street?.message}
            data-testid="checkout-street-input"
          />
          {errors.street && (
            <p className="mt-1 text-sm text-red-500" data-testid="checkout-street-error">{errors.street.message}</p>
          )}
        </Surface>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="checkout-city-state-row">
          <Surface variant="inset" padding="md" data-testid="checkout-city-field">
            <Label htmlFor="city" data-testid="checkout-city-label">
              City
            </Label>
            <Input
              id="city"
              type="text"
              className="mt-2"
              {...register('city', { required: 'City is required' })}
              error={errors.city?.message}
              data-testid="checkout-city-input"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-500" data-testid="checkout-city-error">{errors.city.message}</p>
            )}
          </Surface>
          
          <Surface variant="inset" padding="md" data-testid="checkout-state-field">
            <Label htmlFor="state" data-testid="checkout-state-label">
              State/Province
            </Label>
            <Input
              id="state"
              type="text"
              className="mt-2"
              {...register('state', { required: 'State is required' })}
              error={errors.state?.message}
              data-testid="checkout-state-input"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-500" data-testid="checkout-state-error">{errors.state.message}</p>
            )}
          </Surface>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="checkout-zip-country-row">
          <Surface variant="inset" padding="md" data-testid="checkout-zip-field">
            <Label htmlFor="zipCode" data-testid="checkout-zip-label">
              ZIP/Postal Code
            </Label>
            <Input
              id="zipCode"
              type="text"
              className="mt-2"
              {...register('zipCode', { required: 'ZIP code is required' })}
              error={errors.zipCode?.message}
              data-testid="checkout-zip-input"
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-500" data-testid="checkout-zip-error">{errors.zipCode.message}</p>
            )}
          </Surface>
          
          <Surface variant="inset" padding="md" data-testid="checkout-country-field">
            <Label htmlFor="country" data-testid="checkout-country-label">
              Country
            </Label>
            <Input
              id="country"
              type="text"
              className="mt-2"
              {...register('country', { required: 'Country is required' })}
              error={errors.country?.message}
              data-testid="checkout-country-input"
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-500" data-testid="checkout-country-error">{errors.country.message}</p>
            )}
          </Surface>
        </div>
        
        <Surface variant="inset" padding="md" className="mt-6" data-testid="checkout-summary">
          <div className="flex justify-between items-center mb-4" data-testid="checkout-total">
            <span className="font-semibold text-slate-700" data-testid="checkout-total-label">Order Total:</span>
            <span className="text-lg font-bold text-slate-950" data-testid="checkout-total-amount">${cartTotal.toFixed(2)}</span>
          </div>
          
          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSubmitting || cartTotal <= 0}
            data-testid="checkout-submit-button"
          >
            {isSubmitting ? 'Processing...' : 'Place Order'}
          </Button>
        </Surface>
      </form>
    </div>
  );
} 
