import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastProps, ToastContext } from '../../hooks/useToast';
import styles from './ToastProvider.module.css';
import { useEffect } from 'react';

type InternalToast = ToastProps & {
  id: string;
  createdAt: number;
  open: boolean;
};

const toastMeta = {
  default: {
    label: 'Notice',
    icon: Info,
    iconClassName: styles.defaultIcon,
  },
  success: {
    label: 'Success',
    icon: CheckCircle2,
    iconClassName: styles.successIcon,
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    iconClassName: styles.errorIcon,
  },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <InternalToastProvider key={location.pathname}>{children}</InternalToastProvider>;
}

function InternalToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);

  const addToast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => {
      const activeToasts = prev.filter((toast) => toast.open);
      const exists = activeToasts.some(
        (t) => t.description === props.description && t.variant === props.variant
      );
      if (exists) return prev;
      return [
        ...activeToasts,
        {
          ...props,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
          open: true,
        },
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
      setToasts((prev) => prev.map((toast) => (
        toast.id === id ? { ...toast, open: false } : toast
      )));
    }
  };

  React.useEffect(() => {
    const closedToastIds = toasts
      .filter((toast) => !toast.open)
      .map((toast) => toast.id);

    if (closedToastIds.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => !closedToastIds.includes(toast.id)));
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [toasts]);

  const contextValue = React.useMemo(() => ({ toast: addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right" data-testid="toast-provider">
        {toasts.map(({ id, title, description, action, variant = 'default', open }) => (
          (() => {
            const meta = toastMeta[variant];
            const Icon = meta.icon;

            return (
              <ToastPrimitive.Root
                key={id}
                open={open}
                className={`${styles.toast} ${styles[variant]}`}
                onOpenChange={(open) => handleOpenChange(id, open)}
                data-testid={`toast-${id}`}
              >
                <div className={styles.accent} aria-hidden />
                <div className={styles.iconWrap} data-testid="toast-icon">
                  <Icon className={`${styles.icon} ${meta.iconClassName}`} />
                </div>
                <div className={styles.body} data-testid="toast-content">
                  {!title && <div className={styles.kicker}>{meta.label}</div>}
                  {title && (
                    <ToastPrimitive.Title className={styles.title} data-testid="toast-title">
                      {title}
                    </ToastPrimitive.Title>
                  )}
                  <ToastPrimitive.Description className={styles.description} data-testid="toast-description">
                    {description}
                  </ToastPrimitive.Description>
                  {action && (
                    <div className={styles.actionRow}>
                      <ToastPrimitive.Action altText="toast-action" asChild data-testid="toast-action">
                        {action}
                      </ToastPrimitive.Action>
                    </div>
                  )}
                </div>
                <ToastPrimitive.Close
                  aria-label="Close"
                  className={styles.close}
                  data-testid="toast-close"
                >
                  <X aria-hidden className={styles.closeIcon} data-testid="toast-close-icon" />
                </ToastPrimitive.Close>
              </ToastPrimitive.Root>
            );
          })()
        ))}
        <ToastPrimitive.Viewport data-testid="toast-viewport" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
} 
