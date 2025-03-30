import { AdminProductList } from '../../components/admin/AdminProductList';

export function AdminProductsPage() {
  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="admin-products-page">
      <AdminProductList />
    </div>
  );
} 