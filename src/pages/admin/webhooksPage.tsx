import { AdminWebhooks } from '../../components/admin/AdminWebhooks';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminWebhooksPage() {
  useDocumentTitle('Webhooks');
  return <AdminWebhooks />;
}

export default AdminWebhooksPage;
