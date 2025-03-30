import { useParams } from 'react-router-dom';
import { AdminProductForm } from '../../components/products/AdminProductForm';

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : undefined;
  const isEditing = !!productId;

  return (
    <div className="max-w-3xl mx-auto p-4" data-testid="admin-product-form-page">
      <h1 className="text-2xl font-bold mb-6" data-testid="admin-product-form-title">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h1>
      <AdminProductForm productId={productId} />
    </div>
  );
} 