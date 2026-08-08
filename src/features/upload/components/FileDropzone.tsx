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
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
  amber: 'text-amber-600',
} as const;

function FileDropzone({
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
  const openPicker = () => {
    if (!file && !disabled) inputRef.current?.click();
  };

  return (
    <div
      title={description}
      onDragOver={disabled ? undefined : (event) => {
        event.preventDefault();
        onDraggingChange(true);
      }}
      onDragLeave={disabled ? undefined : () => onDraggingChange(false)}
      onDrop={disabled ? undefined : (event) => {
        event.preventDefault();
        onDraggingChange(false);
        const droppedFile = event.dataTransfer.files?.[0];
        if (droppedFile) onFile(droppedFile);
      }}
      onClick={openPicker}
      className={`flex min-h-16 items-center rounded-lg border px-3 py-2.5 transition ${
        dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
      } ${file || disabled ? 'cursor-default' : 'cursor-pointer'} ${disabled ? 'opacity-60' : ''}`}
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

      <Icon className={`h-4 w-4 shrink-0 ${ACCENT_STYLES[accent]}`} />

      <div className="ml-2.5 min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{file?.name ?? label}</p>
        {file && <p className="mt-0.5 text-[11px] text-slate-400">{formatFileSize(file.size)}</p>}
      </div>

      {file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${file.name}`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="text-[11px] font-medium text-slate-400">Choose</span>
      )}
    </div>
  );
}

export { FileDropzone };
export default FileDropzone;
