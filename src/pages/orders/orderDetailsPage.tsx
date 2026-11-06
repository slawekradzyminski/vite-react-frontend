import { OrderDetails } from '../../components/orders/OrderDetails';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function OrderDetailsPage() {
  useDocumentTitle('Order details');
  return (
    <div className="space-y-6 pb-10" data-testid="order-details-page-container">
      <OrderDetails />
    </div>
  );
}
