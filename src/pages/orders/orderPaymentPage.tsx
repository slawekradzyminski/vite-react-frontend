import { PaymentPage } from '../../components/payments/PaymentPage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function OrderPaymentPage() {
  useDocumentTitle('Pay for order');
  return <PaymentPage />;
}
