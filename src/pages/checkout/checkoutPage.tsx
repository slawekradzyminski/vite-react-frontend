import { CheckoutPage as CheckoutPageComponent } from '../../components/checkout/CheckoutPage';

export function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8" data-testid="checkout-page-container">
      <CheckoutPageComponent />
    </div>
  );
} 