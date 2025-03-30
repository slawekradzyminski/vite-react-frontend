import { CartPage as CartPageComponent } from '../../components/cart/CartPage';

export function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8" data-testid="cart-page-container">
      <CartPageComponent />
    </div>
  );
}