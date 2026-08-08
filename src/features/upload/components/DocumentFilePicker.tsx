import { FileText, X } from 'lucide-react';
import { useRef } from 'react';
import { DOCUMENT_ACCEPT } from '@/features/upload/config/uploadConfig';

interface DocumentFilePickerProps {
  file: File | null;
  disabled: boolean;
  parsing: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}

export default function DocumentFilePicker({
  file,
  disabled,
  parsing,
  onFile,
  onClear,
}: DocumentFilePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        disabled={disabled}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFile(selected);
          event.target.value = '';
        }}
        className="hidden"
      />

      <div className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {file?.name ?? 'Single file'}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            {parsing ? 'Reading chapters…' : file ? 'PDF / EPUB' : 'PDF / EPUB'}
          </p>
        </div>

        {file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            aria-label="Clear book file"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Choose
          </button>
        )}
      </div>
    </div>
  );
}
