import { AdminOrderList } from '../../components/admin/AdminOrderList';

export function AdminOrdersPage() {
  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="admin-orders-page">
      <AdminOrderList />
    </div>
  );
} 