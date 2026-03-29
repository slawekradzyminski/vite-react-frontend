import { type ComponentPropsWithoutRef, type ElementType } from 'react';
import { cn } from '../../lib/utils';

type SurfaceElement = 'div' | 'section' | 'aside';

const surfaceVariants = {
  hero: 'rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,240,235,0.98))] shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)]',
  heroAccent:
    'overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(244,240,235,0.98))] shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]',
  default: 'rounded-[2rem] border border-stone-200/80 bg-white/84 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)]',
  muted: 'rounded-[1.75rem] border border-stone-200/80 bg-white/84 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.45)]',
  inset: 'rounded-[1.5rem] border border-stone-200 bg-stone-50/80',
  raised: 'rounded-[1.4rem] border border-stone-200 bg-white/80',
  danger: 'rounded-[1.75rem] border border-red-200 bg-red-50',
} as const;

const surfacePadding = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 md:p-7',
  xl: 'px-6 py-7 md:px-8',
  message: 'px-6 py-12',
  auth: 'p-8',
} as const;

interface SurfaceProps<T extends ElementType = 'div'> {
  as?: T;
  variant?: keyof typeof surfaceVariants;
  padding?: keyof typeof surfacePadding;
  className?: string;
}

export function Surface<T extends ElementType = SurfaceElement>({
  as,
  variant = 'default',
  padding = 'none',
  className,
  ...props
}: SurfaceProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof SurfaceProps>) {
  const Component = (as || 'div') as ElementType;

  return (
    <Component
      className={cn(surfaceVariants[variant], surfacePadding[padding], className)}
      {...props}
    />
  );
}
