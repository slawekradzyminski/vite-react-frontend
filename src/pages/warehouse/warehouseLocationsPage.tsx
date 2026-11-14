import { WarehouseLocations } from '../../components/warehouse/WarehouseLocations';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function WarehouseLocationsPage() {
  useDocumentTitle('Warehouse locations');
  return <WarehouseLocations />;
}

export default WarehouseLocationsPage;
