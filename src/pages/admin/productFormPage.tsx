import { Link, useNavigate, useParams } from 'react-router';
import { AdminProductForm } from '../../components/products/AdminProductForm';
import { Surface } from '../../components/ui/surface';
import { AdminSectionNav } from '../../components/admin/AdminSectionNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { parseRouteId } from '../../lib/routeIds';

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  // /admin/products/edit/:id always edits: an id that is not a positive integer ("abc", "1.5")
  // names no product, instead of silently turning the page into "Add New Product".
  const isEditing = id !== undefined;
  const productId = parseRouteId(id) ?? undefined;
  const invalidId = isEditing && productId === undefined;
  useDocumentTitle(invalidId ? 'Product not found' : isEditing ? 'Edit Product' : 'Add New Product');
  const navigate = useNavigate();
  const { toast } = useToast();
  // The toast outlives the navigation, so the list page shows the confirmation.
  const handleSaved = () => {
    toast({
      variant: 'success',
      title: isEditing ? 'Product updated' : 'Product created',
      description: isEditing ? 'Your changes are saved.' : 'The product is now in the catalogue.',
    });
    navigate('/admin/products');
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
        {invalidId ? (
          <Surface variant="muted" padding="message" className="text-center" data-testid="product-form-invalid-id">
            <p className="text-lg font-semibold text-slate-700" role="alert" data-testid="product-form-invalid-id-message">Product not found</p>
            <p className="mt-2 text-sm text-slate-500">&quot;{id}&quot; is not a valid product id.</p>
            <Link to="/admin/products" className="mt-4 inline-block text-sm font-medium text-slate-900 underline" data-testid="product-form-invalid-id-back">
              Back to products
            </Link>
          </Surface>
        ) : (
          <AdminProductForm productId={productId} onSuccess={handleSaved} />
        )}
      </div>
    </div>
  );
} 
