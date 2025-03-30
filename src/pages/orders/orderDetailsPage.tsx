import { OrderDetails } from '../../components/orders/OrderDetails';

export function OrderDetailsPage() {
  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="order-details-page-container">
      <OrderDetails />
    </div>
  );
} 