import { AdminReviews } from '../../components/admin/AdminReviews';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminReviewsPage() {
  useDocumentTitle('Review moderation');
  return <AdminReviews />;
}

export default AdminReviewsPage;
