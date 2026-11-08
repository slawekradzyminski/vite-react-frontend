import { WishlistList } from '../../components/wishlist/WishlistList';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function WishlistPage() {
  useDocumentTitle('Wishlist');
  return <WishlistList />;
}

export default WishlistPage;
