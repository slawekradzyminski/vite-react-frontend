import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  'data-testid': string;
}

/**
 * Modal dialog: traps Tab inside, closes on Escape, and gives focus back to the element
 * that opened it. Focus starts on the first field (or the first focusable element).
 */
export function ModalDialog({ open, title, description, onClose, children, className, 'data-testid': testId }: ModalDialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = panel.current?.querySelector<HTMLElement>('input, textarea, select') ?? focusables()[0];
    (first ?? panel.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === firstItem || !panel.current?.contains(active))) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (active === lastItem || !panel.current?.contains(active))) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" data-testid={`${testId}-overlay`}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn('w-full max-w-md rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-2xl outline-none', className)}
        data-testid={testId}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-950" data-testid={`${testId}-title`}>{title}</h2>
        {description && <div id={descriptionId} className="mt-2 text-sm text-slate-600" data-testid={`${testId}-description`}>{description}</div>}
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
