import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchWordsByStatus,
  type LeitnerWord,
} from '@/features/vocabulary/api/leitner';

export function useTrackedWords() {
  const [leitnerWords, setLeitnerWords] = useState<LeitnerWord[]>([]);
  const [unlearnedWords, setUnlearnedWords] = useState<LeitnerWord[]>([]);

  const reload = useCallback(async () => {
    const [leitner, unlearned] = await Promise.all([
      fetchWordsByStatus('leitner'),
      fetchWordsByStatus('unlearned'),
    ]);

    setLeitnerWords(leitner);
    setUnlearnedWords(unlearned);
  }, []);

  useEffect(() => {
    void reload().catch((error) => {
      console.error('Failed to load tracked words:', error);
    });
  }, [reload]);

  const trackedWordMap = useMemo(() => {
    const map = new Map<string, LeitnerWord>();

    for (const word of leitnerWords) map.set(word.word, word);
    for (const word of unlearnedWords) map.set(word.word, word);

    return map;
  }, [leitnerWords, unlearnedWords]);

  return { trackedWordMap, reload };
}
