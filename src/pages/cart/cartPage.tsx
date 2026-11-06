import { CartPage as CartPageComponent } from '../../components/cart/CartPage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function CartPage() {
  useDocumentTitle('Cart');
  return (
    <div className="container mx-auto px-4 py-8" data-testid="cart-page-container">
      <CartPageComponent />
    </div>
  );
}