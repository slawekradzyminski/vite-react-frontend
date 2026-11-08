import { WarehouseBoard } from '../../components/warehouse/WarehouseBoard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function WarehousePage() {
  useDocumentTitle('Warehouse');
  return <WarehouseBoard />;
}

export default WarehousePage;
