import { AdminProductList } from '../../components/admin/AdminProductList';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';

export function AdminProductsPage() {
  return (
    <div className="space-y-6 pb-10" data-testid="admin-products-page">
      <AdminSectionNav />
      <AdminProductList />
    </div>
  );
} 
