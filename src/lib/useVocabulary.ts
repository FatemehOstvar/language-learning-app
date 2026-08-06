import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
} from 'react';
import {
  markWordsAsLearned,
  type WordStatus,
} from '@/lib/leitner';
import { extractWordsFromSentences } from '@/lib/playerWordUtils';
import type { PopupState, Sentence } from '@/lib/playerTypes';
import { useTrackedWords } from '@/lib/useTrackedWords';

export function useVocabulary(sentences: Sentence[], resetKey: string) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [allMarked, setAllMarked] = useState(false);
  const { trackedWordMap, reload } = useTrackedWords();

  useEffect(() => {
    setPopup(null);
    setAllMarked(false);
  }, [resetKey]);

  const openWordPopup = useCallback(
    (
      event: MouseEvent<HTMLElement>,
      word: string,
      sentence: string,
    ) => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();

      setPopup({
        word,
        sentence,
        x: rect.left,
        y: rect.bottom + 8,
      });
    },
    [],
  );

  const handlePopupSaved = useCallback(
    (_word: string, _status: WordStatus) => {
      void reload().catch((error) => {
        console.error('Failed to reload tracked words:', error);
      });
    },
    [reload],
  );

  const markAllLearned = useCallback(async () => {
    setMarkingAll(true);

    try {
      const words = extractWordsFromSentences(sentences);
      if (words.length > 0) await markWordsAsLearned(words);

      await reload();
      setAllMarked(true);
    } catch (error) {
      console.error('Failed to mark words as learned:', error);
    } finally {
      setMarkingAll(false);
    }
  }, [reload, sentences]);

  return {
    trackedWordMap,
    popup,
    closePopup: () => setPopup(null),
    openWordPopup,
    handlePopupSaved,
    markingAll,
    allMarked,
    markAllLearned,
  };
}
