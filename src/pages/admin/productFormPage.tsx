import { useNavigate, useParams } from 'react-router';
import { AdminProductForm } from '../../components/products/AdminProductForm';
import { Surface } from '../../components/ui/surface';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : undefined;
  const isEditing = !!productId;
  useDocumentTitle(isEditing ? 'Edit Product' : 'Add New Product');
  const navigate = useNavigate();
  // The toast provider is keyed by path, so the list page shows the confirmation after navigating.
  const handleSaved = () => {
    navigate('/admin/products', {
      state: {
        toast: {
          variant: 'success',
          title: isEditing ? 'Product updated' : 'Product created',
          description: isEditing ? 'Your changes are saved.' : 'The product is now in the catalogue.',
        },
      },
    });
  };


  return (
    <div className="space-y-6 pb-10" data-testid="admin-product-form-page">
      <AdminSectionNav />
      <Surface as="section" variant="hero" padding="xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="admin-product-form-title">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
      </Surface>
      <div className="mx-auto max-w-3xl">
      <AdminProductForm productId={productId} onSuccess={handleSaved} />
      </div>
    </div>
  );
} 
