import { AdminPayments } from '../../components/admin/AdminPayments';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminPaymentsPage() {
  useDocumentTitle('Payments');
  return <AdminPayments />;
}

export default AdminPaymentsPage;
