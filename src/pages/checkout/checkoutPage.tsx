import { CheckoutPage as CheckoutPageComponent } from '../../components/checkout/CheckoutPage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function CheckoutPage() {
  useDocumentTitle('Checkout');
  return (
    <div data-testid="checkout-page-container">
      <CheckoutPageComponent />
    </div>
  );
} 
