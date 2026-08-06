import { X } from 'lucide-react';

interface WordPopupHeaderProps {
  word: string;
  sentence: string;
  onClose: () => void;
}

export default function WordPopupHeader({
  word,
  sentence,
  onClose,
}: WordPopupHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-3 py-2">
      <div className="min-w-0">
        <p
          id="word-popup-title"
          className="truncate text-base font-semibold text-slate-900"
        >
          {word}
        </p>

        <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-500">
          {sentence}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close word popup (C)"
        title="Close (C)"
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-semibold text-slate-500">
            C
          </kbd>
          <X className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
