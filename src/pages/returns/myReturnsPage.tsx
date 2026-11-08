import { MyReturns } from '../../components/returns/MyReturns';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function MyReturnsPage() {
  useDocumentTitle('My returns');
  return <MyReturns />;
}

export default MyReturnsPage;
