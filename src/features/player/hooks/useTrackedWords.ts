import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAllWords,
  type LeitnerWord,
} from '@/features/vocabulary/api/leitner';

export function useTrackedWords() {
  const [words, setWords] = useState<LeitnerWord[]>([]);

  const reload = useCallback(async () => {
    const allWords = await fetchAllWords();
    setWords(allWords);
  }, []);

  useEffect(() => {
    void reload().catch((error) => {
      console.error('Failed to load tracked words:', error);
    });
  }, [reload]);

  const trackedWordMap = useMemo(() => {
    const map = new Map<string, LeitnerWord>();

    for (const word of words) {
      map.set(word.word, word);
    }

    return map;
  }, [words]);

  return { trackedWordMap, reload };
}
