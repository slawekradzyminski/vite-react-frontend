import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { fieldErrorAriaProps } from '../../lib/fieldError';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  'data-testid'?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, 'data-testid': dataTestId, 'aria-describedby': describedBy, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-stone-200 bg-white/92 px-4 py-2 text-sm text-slate-900 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className,
        )}
        ref={ref}
        data-testid={dataTestId || 'input'}
        {...props}
        {...fieldErrorAriaProps(props.id, error, describedBy)}
      />
    );
  },
);

Input.displayName = 'Input';

export { Input }; 
