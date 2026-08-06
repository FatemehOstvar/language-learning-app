import type { RefObject } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { formatFileSize } from '@/features/upload/utils/fileUtils';
import type { UploadAccent } from '@/features/upload/model/types';

interface DropzoneProps {
  label: string;
  description: string;
  icon: LucideIcon;
  accent: UploadAccent;
  file: File | null;
  dragging: boolean;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement>;
  accept: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  onDraggingChange: (dragging: boolean) => void;
}

const ACCENT_STYLES = {
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    active: 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-700',
    active: 'border-violet-400 bg-violet-50 ring-4 ring-violet-100',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    active: 'border-amber-400 bg-amber-50 ring-4 ring-amber-100',
  },
} as const;

export default function FileDropzone({
  label,
  description,
  icon: Icon,
  accent,
  file,
  dragging,
  disabled,
  inputRef,
  accept,
  onFile,
  onRemove,
  onDraggingChange,
}: DropzoneProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      onDragOver={
        disabled
          ? undefined
          : (event) => {
              event.preventDefault();
              onDraggingChange(true);
            }
      }
      onDragLeave={disabled ? undefined : () => onDraggingChange(false)}
      onDrop={
        disabled
          ? undefined
          : (event) => {
              event.preventDefault();
              onDraggingChange(false);
              const droppedFile = event.dataTransfer.files?.[0];
              if (droppedFile) onFile(droppedFile);
            }
      }
      onClick={
        file || disabled ? undefined : () => inputRef.current?.click()
      }
      className={`relative min-h-44 rounded-2xl border-2 border-dashed p-5 transition-all ${
        dragging
          ? styles.active
          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
      } ${file || disabled ? 'cursor-default' : 'cursor-pointer'} ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) onFile(selectedFile);
        }}
        className="hidden"
      />

      {file ? (
        <div className="flex h-full min-h-32 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${file.name}`}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-500 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center text-center">
          <div
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 max-w-56 text-xs leading-5 text-slate-500">
            {description}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-400">
            Drop a file here or click to browse
          </p>
        </div>
      )}
    </div>
  );
}
