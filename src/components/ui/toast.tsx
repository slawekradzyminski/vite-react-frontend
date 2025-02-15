import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '../../lib/utils';
import { ToastProps, ToastContext } from '../../hooks/toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const addToast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => [...prev, { ...props, id: Math.random().toString() }]);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastPrimitive.Provider>
        {toasts.map(({ id, title, description, action, variant = 'default' }) => (
          <ToastPrimitive.Root
            key={id}
            className={cn(
              'fixed top-4 right-4 z-50 flex w-80 items-center gap-3 rounded-md p-3 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out',
              'data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full',
              variant === 'default' && 'bg-white text-gray-900',
              variant === 'success' && 'bg-green-50 text-green-900 border border-green-200',
              variant === 'error' && 'bg-red-50 text-red-900 border border-red-200'
            )}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((prev) => prev.filter((t) => t.id !== id));
              }
            }}
          >
            <div className="flex-1">
              {title && (
                <ToastPrimitive.Title className="mb-1 text-sm font-medium">
                  {title}
                </ToastPrimitive.Title>
              )}
              <ToastPrimitive.Description className="text-sm">
                {description}
              </ToastPrimitive.Description>
            </div>
            {action && (
              <ToastPrimitive.Action asChild>
                {action}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close
              aria-label="Close"
              className={cn(
                'rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1',
                variant === 'default' && 'text-gray-900 focus:ring-gray-400',
                variant === 'success' && 'text-green-900 focus:ring-green-400',
                variant === 'error' && 'text-red-900 focus:ring-red-400'
              )}
            >
              <span aria-hidden className="text-base">
                ×
              </span>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
} 