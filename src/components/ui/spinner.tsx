import { cn } from '../../lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

export function Spinner({ className, size = 'md', 'data-testid': dataTestId }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div role="status" className={cn('inline-block', className)} data-testid={dataTestId || 'spinner'}>
      <svg
        className={cn('animate-spin text-gray-300', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="spinner-svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          data-testid="spinner-circle"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          data-testid="spinner-path"
        />
      </svg>
      <span className="sr-only" data-testid="spinner-text">Loading...</span>
    </div>
  );
} 