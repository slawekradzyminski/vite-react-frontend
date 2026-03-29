import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, Boxes, Mail, QrCode, Sparkles, UserRound, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { auth } from '../../lib/api';

export function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  return (
    <div className="space-y-6 pb-10" data-testid="home-page">
      <section
        className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,240,235,0.98))] shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]"
        data-testid="home-welcome-section"
      >
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:px-8 md:py-10">
          <div className="space-y-5">
            <Badge variant="outline" tone="tracking" className="gap-2 text-[11px] tracking-[0.28em]">
              <span className="h-2 w-2 rounded-full bg-sky-600" />
              Awesome Testing
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl" data-testid="home-welcome-title">
                Welcome, {user?.data.firstName}!
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Run product operations, inspect live traffic, and open the AI workspace from one control surface.
              </p>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500" data-testid="home-user-email">
                {user?.data.email}
              </p>
            </div>
          </div>

          <div className="grid gap-3 self-start rounded-[1.75rem] border border-stone-200/80 bg-white/88 p-3 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.7)]">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="flex items-center justify-between rounded-2xl border border-transparent bg-stone-50 px-4 py-4 text-left transition hover:border-stone-200 hover:bg-white"
              data-testid="home-products-button"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Boxes className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Products</span>
                  <span className="block text-sm text-slate-600">Catalog, pricing, and inventory control.</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/users')}
              className="flex items-center justify-between rounded-2xl border border-transparent bg-stone-50 px-4 py-4 text-left transition hover:border-stone-200 hover:bg-white"
              data-testid="home-users-button"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-stone-200">
                  <Users className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Users</span>
                  <span className="block text-sm text-slate-600">Accounts, roles, and access checks.</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center justify-between rounded-2xl border border-transparent bg-stone-50 px-4 py-4 text-left transition hover:border-stone-200 hover:bg-white"
              data-testid="home-profile-button"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-stone-200">
                  <UserRound className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Profile & Orders</span>
                  <span className="block text-sm text-slate-600">View orders and manage your personal account information.</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" data-testid="home-content-grid">
        <section
          className="rounded-[2rem] border border-stone-200/80 bg-white/82 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.5)]"
          data-testid="home-features-section"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Core operations</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950" data-testid="home-features-title">
                Daily control areas
              </h2>
            </div>
            <Badge className="font-medium">
              3 primary routes
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5" data-testid="home-feature-products">
              <h3 className="text-lg font-semibold text-slate-900">Product management</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Browse, add, edit, and manage your product inventory.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5" data-testid="home-feature-users">
              <h3 className="text-lg font-semibold text-slate-900">User management</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Manage user accounts and permissions within the system.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5" data-testid="home-feature-profile">
              <h3 className="text-lg font-semibold text-slate-900">Orders and profile</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Check recent orders and keep account details current.
              </p>
            </div>
          </div>
        </section>

        <section
          className="rounded-[2rem] border border-stone-200/80 bg-slate-950 p-6 text-stone-50 shadow-[0_35px_80px_-55px_rgba(15,23,42,0.9)]"
          data-testid="home-ai-section"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">AI workspace</p>
          <h2 className="mt-2 text-2xl font-semibold" data-testid="home-ai-title">Live prompting, chat, and tool flows</h2>
          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5" data-testid="home-feature-llm">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">LLM assistant</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Our AI assistant uses <span className="font-semibold text-white">Server-Sent Events (SSE)</span> to stream responses in real-time, providing immediate assistance while conserving resources.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Generate content with AI assistance.</li>
              <li>Chat with the assistant for immediate help.</li>
              <li>Customize prompts and inspect tool-backed flows.</li>
            </ul>

            <Button
              onClick={() => navigate('/llm')}
              className="mt-6 w-full bg-sky-600 text-white hover:bg-sky-500"
              data-testid="home-llm-button"
            >
              Open AI Assistant
            </Button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-[2rem] border border-stone-200/80 bg-white/82 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.5)]"
          data-testid="home-monitoring-section"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Observability</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950" data-testid="home-monitoring-title">
            Advanced monitoring
          </h2>

          <div className="mt-5 rounded-[1.5rem] border border-amber-200/70 bg-amber-50/80 p-5" data-testid="home-feature-traffic">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Traffic monitor</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Our real-time traffic monitoring system uses <span className="font-semibold">WebSocket technology</span> to provide immediate visibility into all API requests and responses.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>View all HTTP requests in real-time.</li>
              <li>Monitor response times and status codes.</li>
              <li>Debug API interactions immediately.</li>
            </ul>

            <Button
              onClick={() => navigate('/traffic')}
              variant="outline"
              className="mt-6 w-full border-amber-300 bg-white/80 text-amber-900 hover:bg-white"
              data-testid="home-traffic-button"
            >
              Open Traffic Monitor
            </Button>
          </div>
        </section>

        <section
          className="rounded-[2rem] border border-stone-200/80 bg-white/82 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.5)]"
          data-testid="home-utilities-section"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Utilities</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950" data-testid="home-utilities-title">
              Supporting tools
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5" data-testid="home-feature-qr">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-stone-200">
                  <QrCode className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">QR code generator</h3>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                Generate valid and scannable QR codes for any text or URL.
              </p>
              <Button
                onClick={() => navigate('/qr')}
                variant="outline"
                className="mt-5 w-full bg-white"
                data-testid="home-qr-button"
              >
                Generate QR Codes
              </Button>
            </div>

            <div className="flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5" data-testid="home-feature-email">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-stone-200">
                  <Mail className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">Email service</h3>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                Delivery is handled asynchronously with a delay of up to 10 minutes.
              </p>
              <Button
                onClick={() => navigate('/email')}
                variant="outline"
                className="mt-5 w-full bg-white"
                data-testid="home-email-button"
              >
                Send Emails
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
