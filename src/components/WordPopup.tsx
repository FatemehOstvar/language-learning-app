import { useMemo } from 'react';
import { normalizeWord, type WordStatus } from '@/lib/leitner';
import { usePopupDismiss } from '@/lib/usePopupDismiss';
import { useWordPopupForm } from '@/lib/useWordPopupForm';
import { useWordPopupPosition } from '@/lib/useWordPopupPosition';
import WordNoteField from '@/components/WordNoteField';
import WordPopupHeader from '@/components/WordPopupHeader';
import WordPopupSaveButton from '@/components/WordPopupSaveButton';
import WordStatusSelector from '@/components/WordStatusSelector';

interface WordPopupProps {
  word: string;
  sentence: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaved: (word: string, status: WordStatus) => void;
}

export default function WordPopup({
  word,
  sentence,
  x,
  y,
  onClose,
  onSaved,
}: WordPopupProps) {
  const cleanWord = useMemo(() => normalizeWord(word), [word]);
  const position = useWordPopupPosition(x, y);
  const popupRef = usePopupDismiss(onClose);

  const {
    status,
    note,
    saving,
    error,
    setStatus,
    setNote,
    save,
  } = useWordPopupForm({
    cleanWord,
    sentence,
    onSaved,
    onClose,
  });

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="word-popup-title"
      style={position}
      className="fixed z-[100] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      <WordPopupHeader
        word={cleanWord || word}
        sentence={sentence}
        onClose={onClose}
      />

      <div className="space-y-4 p-4">
        <WordStatusSelector value={status} onChange={setStatus} />

        {status === 'leitner' && (
          <WordNoteField value={note} onChange={setNote} />
        )}

        {error && (
          <p role="alert" className="text-xs leading-5 text-red-600">
            {error}
          </p>
        )}

        <WordPopupSaveButton
          saving={saving}
          disabled={!cleanWord}
          onClick={save}
        />
      </div>
    </div>
  );
}
