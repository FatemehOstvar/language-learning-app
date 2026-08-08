import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent,
} from 'react';
import {
  markWordsAsLearned,
  type WordStatus,
} from '@/features/vocabulary/api/leitner';
import { extractWordsFromSentences } from '@/features/player/utils/wordTrackingUtils';
import type { PopupState, Sentence } from '@/features/player/model/types';
import { useTrackedWords } from '@/features/player/hooks/useTrackedWords';

function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function getSurfaceWord(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}'-]/gu, '')
    .trim();
}

function copyWord(text: string) {
  if (!text) return;

  try {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => {
        legacyCopy(text);
      });
      return;
    }
  } catch {
    // Fall through to the legacy clipboard path.
  }

  legacyCopy(text);
}

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
      event: PointerEvent<HTMLElement>,
      word: string,
      sentence: string,
    ) => {
      // Keep the fast pointer-down interaction, but do not hijack right-click
      // or auxiliary mouse buttons. Touch/pen events still activate normally.
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      const surfaceWord = getSurfaceWord(word);

      // Clipboard calls are most reliable while still inside the user's
      // pointer gesture, so copy before React renders the popup. Keep German
      // capitalization intact because it can carry lexical meaning.
      copyWord(surfaceWord || word);

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
