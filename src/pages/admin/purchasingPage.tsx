import { AdminPurchasing } from '../../components/admin/AdminPurchasing';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminPurchasingPage() {
  useDocumentTitle('Purchasing');
  return <AdminPurchasing />;
}

export default AdminPurchasingPage;
