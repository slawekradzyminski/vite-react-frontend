import { AdminGiftCards } from '../../components/admin/AdminGiftCards';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminGiftCardsPage() {
  useDocumentTitle('Gift cards');
  return <AdminGiftCards />;
}

export default AdminGiftCardsPage;
