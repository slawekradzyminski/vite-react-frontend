import { AdminCurrencies } from '../../components/admin/AdminCurrencies';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminCurrenciesPage() {
  useDocumentTitle('Currencies');
  return <AdminCurrencies />;
}

export default AdminCurrenciesPage;
