import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteWord,
  fetchTodayReviewWords,
  fetchWordsByStatus,
  reviewWord,
  type LeitnerWord,
} from '@/features/vocabulary/api/leitner';
import { LEITNER_COPY } from '@/features/leitner/config/pageConfig';
import type { LeitnerView } from '@/features/leitner/model/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useLeitnerPage() {
  const [view, setView] = useState<LeitnerView>('overview');

  const [leitnerWords, setLeitnerWords] = useState<LeitnerWord[]>([]);
  const [unlearnedWords, setUnlearnedWords] = useState<LeitnerWord[]>([]);
  const [reviewWords, setReviewWords] = useState<LeitnerWord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leitner, unlearned, review] = await Promise.all([
        fetchWordsByStatus('leitner'),
        fetchWordsByStatus('unlearned'),
        fetchTodayReviewWords(),
      ]);

      setLeitnerWords(leitner);
      setUnlearnedWords(unlearned);
      setReviewWords(review);
    } catch (loadError) {
      setError(getErrorMessage(loadError, LEITNER_COPY.loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentReviewWord = reviewWords[reviewIndex] ?? null;
  const todayCount = reviewWords.length;

  const reviewProgress = useMemo(() => {
    if (reviewWords.length === 0) {
      return 0;
    }

    return ((reviewIndex + 1) / reviewWords.length) * 100;
  }, [reviewIndex, reviewWords.length]);

  const startReview = useCallback(() => {
    if (reviewWords.length === 0) {
      return;
    }

    setView('review');
    setReviewIndex(0);
    setRevealed(false);
    setReviewDone(false);
    setError(null);
  }, [reviewWords.length]);

  const exitReview = useCallback(() => {
    setView('overview');
    setReviewIndex(0);
    setRevealed(false);
    setReviewDone(false);
    void load();
  }, [load]);

  const revealCurrentWord = useCallback(() => {
    setRevealed(true);
  }, []);

  const submitReview = useCallback(
    async (remembered: boolean) => {
      const word = reviewWords[reviewIndex];

      if (!word) {
        return;
      }

      setError(null);

      try {
        const updatedWord = await reviewWord(word.id, remembered);

        if (updatedWord) {
          setLeitnerWords((currentWords) => {
            if (updatedWord.status !== 'leitner') {
              return currentWords.filter(
                (currentWord) => currentWord.id !== updatedWord.id,
              );
            }

            return currentWords.map((currentWord) =>
              currentWord.id === updatedWord.id
                ? updatedWord
                : currentWord,
            );
          });
        }

        const isLastWord = reviewIndex + 1 >= reviewWords.length;

        if (isLastWord) {
          setReviewDone(true);
          return;
        }

        setReviewIndex((currentIndex) => currentIndex + 1);
        setRevealed(false);
      } catch (reviewError) {
        setError(getErrorMessage(reviewError, LEITNER_COPY.reviewError));
      }
    },
    [reviewIndex, reviewWords],
  );

  const removeWord = useCallback(async (id: string) => {
    setError(null);

    try {
      await deleteWord(id);

      setLeitnerWords((words) => words.filter((word) => word.id !== id));
      setUnlearnedWords((words) => words.filter((word) => word.id !== id));
      setReviewWords((words) => words.filter((word) => word.id !== id));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, LEITNER_COPY.deleteError));
    }
  }, []);

  return {
    view,
    leitnerWords,
    unlearnedWords,
    reviewWords,
    loading,
    error,
    reviewIndex,
    revealed,
    reviewDone,
    currentReviewWord,
    todayCount,
    reviewProgress,

    load,
    startReview,
    exitReview,
    revealCurrentWord,
    submitReview,
    removeWord,
  };
}
