import { useCallback, useState } from 'react';
import {
  upsertWord,
  type WordStatus,
} from '@/features/vocabulary/api/leitner';

interface UseWordPopupFormOptions {
  cleanWord: string;
  sentence: string;
  onSaved: (word: string, status: WordStatus) => void;
  onClose: () => void;
}

export function useWordPopupForm({
  cleanWord,
  sentence,
  onSaved,
  onClose,
}: UseWordPopupFormOptions) {
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] =
    useState<WordStatus | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveStatus = useCallback(
    async (nextStatus: WordStatus) => {
      if (!cleanWord || savingStatus || savingNote) {
        return;
      }

      setSavingStatus(nextStatus);
      setError(null);

      try {
        // Status buttons save immediately.
        // Passing undefined preserves an existing note.
        await upsertWord(
          cleanWord,
          sentence,
          nextStatus,
          undefined,
        );

        onSaved(cleanWord, nextStatus);
        onClose();
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'The word could not be saved.',
        );
      } finally {
        setSavingStatus(null);
      }
    },
    [
      cleanWord,
      onClose,
      onSaved,
      savingNote,
      savingStatus,
      sentence,
    ],
  );

  const saveNote = useCallback(async () => {
    if (!cleanWord || savingStatus || savingNote) {
      return;
    }

    setSavingNote(true);
    setError(null);

    try {
      // Notes belong to Leitner entries and are saved only
      // through the explicit Save note button.
      await upsertWord(cleanWord, sentence, 'leitner', note);

      onSaved(cleanWord, 'leitner');
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The note could not be saved.',
      );
    } finally {
      setSavingNote(false);
    }
  }, [
    cleanWord,
    note,
    onClose,
    onSaved,
    savingNote,
    savingStatus,
    sentence,
  ]);

  const updateNote = useCallback((value: string) => {
    setNote(value);
    setError(null);
  }, []);

  return {
    note,
    savingStatus,
    savingNote,
    error,
    setNote: updateNote,
    saveStatus,
    saveNote,
  };
}
