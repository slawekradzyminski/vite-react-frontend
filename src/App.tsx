import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './AppRoutes';
import { ToastProvider } from './components/ui/ToastProvider';
import { Navigation } from './components/layout/Navigation';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <Theme>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <AppRoutes />
              </main>
            </div>
          </Theme>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
