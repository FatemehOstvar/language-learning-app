import { normalizeWord, type LeitnerWord } from '@/features/vocabulary/api/leitner';
import type { Sentence } from '@/features/player/model/types';

export function getWordClass(
  word: string,
  trackedWords: Map<string, LeitnerWord>,
): string {
  const normalized = normalizeWord(word);
  if (!normalized) return 'text-gray-950';

  const entry = trackedWords.get(normalized);

  if (entry?.status === 'leitner') {
    return 'bg-amber-200 text-gray-950 font-medium';
  }

  if (entry?.status === 'learned') {
    return 'text-gray-950';
  }

  // A word with no database record has never been marked as known.
  // Treat it as unknown, just like an explicitly unlearned word.
  return 'bg-blue-100 text-gray-950';
}

export function extractWordsFromSentences(
  sentences: Sentence[],
): { word: string }[] {
  const words = new Set<string>();

  for (const sentence of sentences) {
    for (const rawWord of sentence.text.split(/\s+/)) {
      const normalized = normalizeWord(rawWord);
      if (normalized) words.add(normalized);
    }
  }

  return Array.from(words, (word) => ({ word }));
}
