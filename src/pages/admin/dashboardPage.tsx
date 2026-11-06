import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminDashboardPage() {
  useDocumentTitle('Admin Dashboard');
  return (
    <div data-testid="admin-dashboard-page">
      <AdminDashboard />
    </div>
  );
} 
