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

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 