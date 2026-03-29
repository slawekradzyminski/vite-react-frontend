import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowUpRight, Coffee, Linkedin } from 'lucide-react';
import { AppRoutes } from './AppRoutes';
import { ToastProvider } from './components/ui/ToastProvider';
import { Navigation } from './components/layout/Navigation';
import { Button } from './components/ui/button';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

const queryClient = new QueryClient();

const footerLinks = [
  {
    label: 'Read the blog',
    href: 'https://www.awesome-testing.com/',
    icon: 'blog',
    testId: 'footer-blog-link',
  },
  {
    label: 'Follow on LinkedIn',
    href: 'https://www.linkedin.com/in/slawekradzyminski/?locale=en',
    icon: Linkedin,
    testId: 'footer-linkedin-link',
  },
  {
    label: 'Buy me a coffee',
    href: 'https://buymeacoffee.com/awesometesting',
    icon: Coffee,
    testId: 'footer-coffee-link',
  },
];

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <Theme>
            <div className="flex min-h-screen flex-col bg-transparent text-slate-900">
              <Navigation />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                <AppRoutes />
              </main>
              <footer className="border-t border-stone-200/80 bg-stone-50/82" data-testid="app-footer">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                  <div className="space-y-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
                      Stay in touch
                    </p>
                    <p className="text-sm text-slate-600">
                      Follow Awesome Testing blog, author&apos;s LinkedIn, or buy me a coffee.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end">
                    {footerLinks.map(({ label, href, icon: Icon, testId }) => (
                      <Button
                        key={href}
                        asChild
                        variant="secondary"
                        className="h-auto min-w-[11rem] justify-between rounded-full border border-stone-200 bg-white/85 px-4 py-2.5 text-left text-sm font-medium text-slate-700 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:text-slate-900"
                      >
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          data-testid={testId}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-slate-600">
                              {Icon === 'blog' ? (
                                <img
                                  src="/branding/generated/at-transparent.png"
                                  alt=""
                                  aria-hidden="true"
                                  className="h-4.5 w-4.5 object-contain"
                                />
                              ) : (
                                <Icon className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span>{label}</span>
                          </span>
                          <ArrowUpRight className="ml-5 h-3.5 w-3.5 shrink-0" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </footer>
            </div>
          </Theme>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
