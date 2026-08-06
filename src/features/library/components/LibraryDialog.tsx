import {
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

interface LibraryDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

export default function LibraryDialog({
  open,
  title,
  description,
  children,
  onClose,
}: LibraryDialogProps) {
  const panelRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      onPointerDown={(event) => {
        if (
          !panelRef.current?.contains(
            event.target as Node,
          )
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2
              id="library-dialog-title"
              className="text-base font-semibold text-slate-900"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DeleteWarning() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p>
        Lessons inside a deleted folder are moved to
        Unfiled. They are not deleted.
      </p>
    </div>
  );
}
