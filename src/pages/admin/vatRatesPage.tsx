import { AdminVatRates } from '../../components/admin/AdminVatRates';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminVatRatesPage() {
  useDocumentTitle('VAT rates');
  return <AdminVatRates />;
}

export default AdminVatRatesPage;
