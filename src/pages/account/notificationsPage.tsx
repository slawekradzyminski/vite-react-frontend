import { Link } from 'react-router';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Surface } from '../../components/ui/surface';
import { PageHeader } from '../../components/commerce/shared';
import { NotificationEmails } from '../../components/notifications/NotificationEmails';

export function NotificationsPage() {
  useDocumentTitle('My notifications');
  return (
    <div className="space-y-6 pb-10" data-testid="notifications-page">
      <Surface as="section" variant="hero" padding="xl">
        <PageHeader
          eyebrow="Account"
          title="My notifications"
          description="Emails the shop sent you about payments, shipments, returns, points and gift cards."
          aside={<Link to="/account/webhooks" className="text-sm text-sky-700 hover:underline" data-testid="notifications-webhooks-link">Manage webhooks →</Link>}
        />
      </Surface>
      <Surface as="section" variant="default" padding="lg" aria-labelledby="notifications-heading" data-testid="notifications-section">
        <h2 id="notifications-heading" className="mb-4 text-lg font-semibold text-slate-950">Sent emails</h2>
        <NotificationEmails />
      </Surface>
    </div>
  );
}
