import { useParams } from 'react-router-dom';
import { AdminProductForm } from '../../components/products/AdminProductForm';
import { Surface } from '../../components/ui/surface';

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : undefined;
  const isEditing = !!productId;

  return (
    <div className="space-y-6 pb-10" data-testid="admin-product-form-page">
      <Surface as="section" variant="hero" padding="xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="admin-product-form-title">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
      </Surface>
      <div className="mx-auto max-w-3xl">
      <AdminProductForm productId={productId} />
      </div>
    </div>
  );
} 
