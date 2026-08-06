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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3">
      <div className="min-w-0">
        <p
          id="word-popup-title"
          className="truncate text-lg font-semibold text-slate-900"
        >
          {word}
        </p>

        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
          {sentence}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close word popup"
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
