import { AdminInventory } from '../../components/admin/AdminInventory';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminInventoryPage() {
  useDocumentTitle('Inventory');
  return <AdminInventory />;
}

export default AdminInventoryPage;
