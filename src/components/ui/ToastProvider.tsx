import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { useLocation } from 'react-router-dom';
import { ToastProps, ToastContext } from '../../hooks/useToast';
import styles from './ToastProvider.module.css';
import { useEffect } from 'react';

type InternalToast = ToastProps & {
  id: string;
  createdAt: number;
  open: boolean;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <InternalToastProvider key={location.pathname}>{children}</InternalToastProvider>;
}

function InternalToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);

  const addToast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => {
      const exists = prev.some(
        (t) => t.description === props.description && t.variant === props.variant
      );
      if (exists) return prev;
      return [
        ...prev,
        { ...props, id: Math.random().toString(), createdAt: Date.now(), open: true },
      ];
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setToasts((prev) =>
        prev.map((toast) => {
          if (toast.open && Date.now() - toast.createdAt >= 5000) {
            return { ...toast, open: false };
          }
          return toast;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (id: string, open: boolean) => {
    if (!open) {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const contextValue = React.useMemo(() => ({ toast: addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right" data-testid="toast-provider">
        {toasts.map(({ id, title, description, action, variant = 'default', open }) => (
          <ToastPrimitive.Root
            key={id}
            open={open}
            className={`${styles.toast} ${styles[variant]}`}
            onOpenChange={(open) => handleOpenChange(id, open)}
            data-testid={`toast-${id}`}
          >
            <div className="flex-1" data-testid="toast-content">
              {title && (
                <ToastPrimitive.Title className={styles.title} data-testid="toast-title">
                  {title}
                </ToastPrimitive.Title>
              )}
              <ToastPrimitive.Description className={styles.description} data-testid="toast-description">
                {description}
              </ToastPrimitive.Description>
            </div>
            {action && (
              <ToastPrimitive.Action altText="toast-action" asChild data-testid="toast-action">
                {action}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close
              aria-label="Close"
              className={styles.close}
              data-testid="toast-close"
            >
              <span aria-hidden className={styles.closeIcon} data-testid="toast-close-icon">×</span>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport data-testid="toast-viewport" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
} 