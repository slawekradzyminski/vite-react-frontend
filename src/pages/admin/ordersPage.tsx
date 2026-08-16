import { AdminOrderList } from '../../components/admin/AdminOrderList';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';

export function AdminOrdersPage() {
  return (
    <div className="space-y-6 pb-10" data-testid="admin-orders-page">
      <AdminSectionNav />
      <AdminOrderList />
    </div>
  );
} 
