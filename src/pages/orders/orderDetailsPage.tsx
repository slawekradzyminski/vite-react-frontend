import { OrderDetails } from '../../components/orders/OrderDetails';

export function OrderDetailsPage() {
  return (
    <div className="space-y-6 pb-10" data-testid="order-details-page-container">
      <OrderDetails />
    </div>
  );
}
