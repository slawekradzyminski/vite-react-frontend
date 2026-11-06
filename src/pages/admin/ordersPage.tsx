import { AdminOrderList } from '../../components/admin/AdminOrderList';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminOrdersPage() {
  useDocumentTitle('Manage Orders');
  return (
    <div className="space-y-6 pb-10" data-testid="admin-orders-page">
      <AdminSectionNav />
      <AdminOrderList />
    </div>
  );
} 
