import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { ToastProps, ToastContext } from '../../hooks/toast';
import styles from './toast.module.css';

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
            className={`${styles.toast} ${styles[variant]}`}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((prev) => prev.filter((t) => t.id !== id));
              }
            }}
          >
            <div className="flex-1">
              {title && (
                <ToastPrimitive.Title className={styles.title}>
                  {title}
                </ToastPrimitive.Title>
              )}
              <ToastPrimitive.Description className={styles.description}>
                {description}
              </ToastPrimitive.Description>
            </div>
            {action && (
              <ToastPrimitive.Action altText="toast-action" asChild>
                {action}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close
              aria-label="Close"
              className={styles.close}
            >
              <span aria-hidden className={styles.closeIcon}>
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