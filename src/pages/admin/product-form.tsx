import { useParams } from 'react-router-dom';
import { AdminProductForm } from '../../components/products/AdminProductForm';

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : undefined;
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {productId ? 'Edit Product' : 'Create New Product'}
      </h1>
      <AdminProductForm productId={productId} />
    </div>
  );
} 