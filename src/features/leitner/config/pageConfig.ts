export const LEITNER_COPY = {
  pageTitle: 'Leitner System',
  pageDescription: 'Review words and track your progress.',

  todayTitle: "Today's Review",
  noWordsDue: 'No words due today',
  startReview: 'Start Review',

  leitnerListTitle: 'In Leitner',
  leitnerListEmpty:
    'No words in the Leitner system yet. Click words in the player to add them.',

  unlearnedListTitle: 'Unlearned',
  unlearnedListEmpty: 'No skipped words.',

  reviewQuestion: 'Do you remember this word?',
  revealContext: 'Reveal Context',
  forgot: 'Forgot',
  remembered: 'Remembered',

  completeTitle: 'All caught up!',
  completeDescription: "You've reviewed all due words for today.",
  backToLeitner: 'Back to Leitner',

  loadError: 'Failed to load words.',
  reviewError: 'Review failed.',
  deleteError: 'Delete failed.',
} as const;

export const WORD_LIST_THEMES = {
  amber: {
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  slate: {
    icon: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600',
  },
} as const;

export type WordListTheme = keyof typeof WORD_LIST_THEMES;

export function formatDueCount(count: number): string {
  return count === 1 ? '1 word due' : `${count} words due`;
}

export function formatReviewDate(date: string): string {
  return new Date(date).toLocaleDateString();
}
