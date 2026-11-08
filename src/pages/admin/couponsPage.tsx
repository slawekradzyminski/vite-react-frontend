import { AdminCoupons } from '../../components/admin/AdminCoupons';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminCouponsPage() {
  useDocumentTitle('Coupons');
  return <AdminCoupons />;
}

export default AdminCouponsPage;
