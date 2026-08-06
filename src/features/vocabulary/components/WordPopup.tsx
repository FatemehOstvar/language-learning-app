import {
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  normalizeWord,
  type WordStatus,
} from '@/features/vocabulary/api/leitner';
import { usePopupDismiss } from '@/features/vocabulary/hooks/useDismissiblePopup';
import { useWordPopupForm } from '@/features/vocabulary/hooks/useWordPopupForm';
import { useWordPopupPosition } from '@/features/vocabulary/hooks/useAnchoredPopupPosition';
import WordNoteField from '@/features/vocabulary/components/WordNoteField';
import WordPopupHeader from '@/features/vocabulary/components/WordPopupHeader';
import WordPopupSubmitButton from '@/features/vocabulary/components/WordPopupSubmitButton';
import WordStatusSelector from '@/features/vocabulary/components/WordStatusSelector';

interface WordPopupProps {
  word: string;
  sentence: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaved: (word: string, status: WordStatus) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'INPUT' ||
    target.isContentEditable
  );
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
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const {
    note,
    savingStatus,
    savingNote,
    error,
    setNote,
    saveStatus,
    saveNote,
  } = useWordPopupForm({
    cleanWord,
    sentence,
    onSaved,
    onClose,
  });

  const busy = savingStatus !== null || savingNote;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const editable = isEditableTarget(event.target);

      // While typing in the note, normal letters must remain available.
      // Ctrl/Cmd+S is still allowed to save the note.
      if (
        editable &&
        !(
          (event.ctrlKey || event.metaKey) &&
          key === 's'
        )
      ) {
        return;
      }

      if (busy) {
        return;
      }

      if (key === 'a') {
        event.preventDefault();
        void saveStatus('leitner');
        return;
      }

      if (
        key === 's' &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        void saveStatus('unlearned');
        return;
      }

      if (key === 'd') {
        event.preventDefault();
        void saveStatus('learned');
        return;
      }

      if (key === 'f') {
        event.preventDefault();
        noteRef.current?.focus();
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        key === 's'
      ) {
        event.preventDefault();
        void saveNote();
        return;
      }

      if (key === 'c') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [busy, onClose, saveNote, saveStatus]);

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="word-popup-title"
      style={position}
      className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
    >
      <WordPopupHeader
        word={cleanWord || word}
        sentence={sentence}
        onClose={onClose}
      />

      <div className="min-h-0 overflow-y-auto p-2">
        <div className="grid gap-2 min-[390px]:grid-cols-[132px_minmax(0,1fr)]">
          <WordStatusSelector
            savingStatus={savingStatus}
            disabled={!cleanWord || busy}
            onSelect={saveStatus}
          />

          <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <WordNoteField
              ref={noteRef}
              value={note}
              onChange={setNote}
            />

            <div className="mt-1 flex justify-end">
              <WordPopupSubmitButton
                saving={savingNote}
                disabled={!cleanWord || busy}
                onClick={saveNote}
              />
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-2 text-xs leading-4 text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
