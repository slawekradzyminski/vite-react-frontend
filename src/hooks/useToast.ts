import * as React from 'react';

export interface ToastProps {
  title?: string;
  description: string;
  action?: React.ReactNode;
  variant?: 'default' | 'success' | 'error';
}

type ToastContextValue = {
  toast: (props: ToastProps) => void;
};

export const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to access toast functionality.
 * Must be used within a ToastProvider component.
 * @returns {ToastContextValue} Toast context value containing the toast function
 * @throws {Error} If used outside of ToastProvider
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 