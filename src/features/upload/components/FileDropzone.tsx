import type { RefObject } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { formatFileSize } from '@/features/upload/utils/fileUtils';
import type { UploadAccent } from '@/features/upload/model/types';

interface FileDropzoneProps {
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
    icon: 'text-emerald-600',
    active: 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-100',
  },
  violet: {
    icon: 'text-violet-600',
    active: 'border-violet-400 bg-violet-50/50 ring-2 ring-violet-100',
  },
  amber: {
    icon: 'text-amber-600',
    active: 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-100',
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
}: FileDropzoneProps) {
  const styles = ACCENT_STYLES[accent];

  const openPicker = () => {
    if (!file && !disabled) {
      inputRef.current?.click();
    }
  };

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
              if (droppedFile) {
                onFile(droppedFile);
              }
            }
      }
      onClick={openPicker}
      className={`group relative flex min-h-28 items-center rounded-xl border border-dashed px-4 py-4 transition ${
        dragging
          ? styles.active
          : 'border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50'
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
          if (selectedFile) {
            onFile(selectedFile);
          }
        }}
        className="hidden"
      />

      {file ? (
        <div className="flex w-full min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Icon className={`h-4.5 w-4.5 ${styles.icon}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatFileSize(file.size)}
            </p>
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
        <div className="flex w-full items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Icon className={`h-4.5 w-4.5 ${styles.icon}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800">
              {label}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition group-hover:border-slate-300">
            Choose
          </span>
        </div>
      )}
    </div>
  );
}
