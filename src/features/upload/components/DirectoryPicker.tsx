import { FolderOpen, X } from 'lucide-react';
import { useRef } from 'react';

interface DirectoryPickerProps {
  label: string;
  description: string;
  summary: string | null;
  disabled: boolean;
  onFiles: (files: File[]) => void;
  onClear: () => void;
}

export default function DirectoryPicker({
  label,
  description,
  summary,
  disabled,
  onFiles,
  onClear,
}: DirectoryPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3" title={description}>
      <input
        ref={(node) => {
          inputRef.current = node;
          if (node) {
            node.setAttribute('webkitdirectory', '');
            node.setAttribute('directory', '');
          }
        }}
        type="file"
        multiple
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []) as File[];
          if (files.length > 0) onFiles(files);
          event.target.value = '';
        }}
        className="hidden"
      />

      <div className="flex items-center gap-2.5">
        <FolderOpen className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{label}</p>
          {summary && <p className="mt-0.5 truncate text-[11px] text-slate-400">{summary}</p>}
        </div>

        {summary ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            aria-label={`Clear ${label}`}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
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
