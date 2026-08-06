import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Inbox,
  Loader2,
  StickyNote,
  X,
} from 'lucide-react';
import {
  normalizeWord,
  upsertWord,
  type WordStatus,
} from '@/lib/leitner';

interface WordPopupProps {
  word: string;
  sentence: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaved: (word: string, status: WordStatus) => void;
}

const STATUS_OPTIONS: Array<{
  value: WordStatus;
  label: string;
  description: string;
  icon: typeof Brain;
}> = [
  {
    value: 'leitner',
    label: 'Add to Leitner',
    description: 'Review this word with spaced repetition.',
    icon: Brain,
  },
  {
    value: 'unlearned',
    label: 'Unlearned',
    description: 'Keep it marked as an unknown word.',
    icon: Inbox,
  },
  {
    value: 'learned',
    label: 'Learned',
    description: 'Mark this word as already known.',
    icon: CheckCircle2,
  },
];

export default function WordPopup({
  word,
  sentence,
  x,
  y,
  onClose,
  onSaved,
}: WordPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<WordStatus>('leitner');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanWord = useMemo(() => normalizeWord(word), [word]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!popupRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const position = useMemo(() => {
    const width = 340;
    const margin = 12;

    return {
      left: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
      top: Math.max(margin, Math.min(y, window.innerHeight - 420)),
      width,
    };
  }, [x, y]);

  const handleSave = async () => {
    if (!cleanWord || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await upsertWord(
        cleanWord,
        sentence,
        status,
        status === 'leitner' ? note : undefined,
      );

      onSaved(cleanWord, status);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The word could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="word-popup-title"
      style={position}
      className="fixed z-[100] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p
            id="word-popup-title"
            className="truncate text-lg font-semibold text-slate-900"
          >
            {cleanWord || word}
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

      <div className="space-y-4 p-4">
        <div className="grid gap-2">
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = status === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setStatus(option.value);
                  setError(null);
                }}
                aria-pressed={selected}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  selected
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    selected ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-medium ${
                      selected ? 'text-emerald-900' : 'text-slate-800'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {status === 'leitner' && (
          <div>
            <label
              htmlFor="leitner-note"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <StickyNote className="h-3.5 w-3.5 text-slate-400" />
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="leitner-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Meaning, translation, grammar hint, mnemonic…"
              rows={3}
              maxLength={1000}
              autoFocus
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">
              {note.length}/1000
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs leading-5 text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !cleanWord}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save word'}
        </button>
      </div>
    </div>
  );
}