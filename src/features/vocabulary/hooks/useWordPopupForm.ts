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
  const [status, setStatusState] = useState<WordStatus>('leitner');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStatus = useCallback((nextStatus: WordStatus) => {
    setStatusState(nextStatus);
    setError(null);
  }, []);

  const save = useCallback(async () => {
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
  }, [cleanWord, note, onClose, onSaved, saving, sentence, status]);

  return {
    status,
    note,
    saving,
    error,
    setStatus,
    setNote,
    save,
  };
}
