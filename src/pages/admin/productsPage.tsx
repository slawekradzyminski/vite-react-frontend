import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { AdminProductList } from '../../components/admin/AdminProductList';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';

export function AdminProductsPage() {
  useDocumentTitle('Manage Products');
  const location = useLocation();
  const { toast } = useToast();

  // A confirmation handed over by the product form (see AdminProductFormPage).
  useEffect(() => {
    if (location.state?.toast) {
      toast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location, toast]);

  return (
    <div className="space-y-6 pb-10" data-testid="admin-products-page">
      <AdminSectionNav />
      <AdminProductList />
    </div>
  );
}
