import { AdminReturns } from '../../components/admin/AdminReturns';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminReturnsPage() {
  useDocumentTitle('Returns');
  return <AdminReturns />;
}

export default AdminReturnsPage;
