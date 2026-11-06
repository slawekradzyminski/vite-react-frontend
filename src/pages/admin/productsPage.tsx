import { AdminProductList } from '../../components/admin/AdminProductList';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminProductsPage() {
  useDocumentTitle('Manage Products');
  return (
    <div className="space-y-6 pb-10" data-testid="admin-products-page">
      <AdminSectionNav />
      <AdminProductList />
    </div>
  );
} 
