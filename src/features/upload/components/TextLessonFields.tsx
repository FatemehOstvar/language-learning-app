import { Upload } from 'lucide-react';
import { useRef } from 'react';
import { TEXT_ACCEPT } from '@/features/upload/config/uploadConfig';

interface TextLessonFieldsProps {
  value: string;
  wordCount: number;
  disabled: boolean;
  sourceFileName: string | null;
  onChange: (value: string) => void;
  onTextFile: (file: File) => void;
}

export default function TextLessonFields({
  value,
  wordCount,
  disabled,
  sourceFileName,
  onChange,
  onTextFile,
}: TextLessonFieldsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs text-slate-400">
          <span>{wordCount} words</span>
          {sourceFileName && <span className="ml-2 truncate">· {sourceFileName}</span>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={TEXT_ACCEPT}
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onTextFile(file);
            event.target.value = '';
          }}
          className="hidden"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          File
        </button>
      </div>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste or upload text…"
        rows={14}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-50"
      />
    </section>
  );
}
