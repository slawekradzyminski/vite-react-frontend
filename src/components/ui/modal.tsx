import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** `drawer` slides in from the right edge; `center` is a classic dialog. */
  placement?: 'center' | 'drawer';
  'data-testid': string;
}

// A native modal <dialog>: showModal() makes the rest of the page inert, so focus stays
// inside, Escape closes it and the browser returns focus to the opener.
export function Modal({ open, onClose, title, description, children, placement = 'center', 'data-testid': testId }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className={cn(
        'bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/40',
        placement === 'drawer'
          ? 'm-0 ml-auto h-full max-h-none w-full max-w-2xl rounded-none sm:rounded-l-[1.75rem]'
          : 'm-auto w-[min(32rem,calc(100%-2rem))] rounded-[1.75rem]',
      )}
      data-testid={testId}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-slate-950" data-testid={`${testId}-title`}>{title}</h2>
              {description && <p id={descriptionId} className="mt-1 text-sm text-slate-600">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-slate-500 hover:bg-stone-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              data-testid={`${testId}-close`}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  'data-testid': string;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, pending = false, 'data-testid': testId }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} data-testid={testId}>
      <p className="text-sm text-slate-700" data-testid={`${testId}-message`}>{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-stone-200 px-4 text-sm font-medium text-slate-700 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          data-testid={`${testId}-cancel`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="h-10 rounded-xl bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          data-testid={`${testId}-confirm`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
