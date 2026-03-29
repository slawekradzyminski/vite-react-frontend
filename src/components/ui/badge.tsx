import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-stone-200 bg-stone-50 text-slate-600',
        outline: 'border-stone-200 bg-white/85 text-slate-600',
        solid: 'border-slate-900 bg-slate-900 text-stone-50',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        error: 'border-red-200 bg-red-50 text-red-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
      },
      tone: {
        default: '',
        tracking: 'uppercase tracking-[0.22em]',
      },
    },
    defaultVariants: {
      variant: 'default',
      tone: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, tone }), className)} {...props} />;
}
