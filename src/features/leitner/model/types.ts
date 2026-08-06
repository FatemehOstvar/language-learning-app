import type { LeitnerWord } from '@/features/vocabulary/api/leitner';

export type LeitnerView = 'overview' | 'review';

export interface LeitnerPageState {
  view: LeitnerView;
  leitnerWords: LeitnerWord[];
  unlearnedWords: LeitnerWord[];
  reviewWords: LeitnerWord[];
  loading: boolean;
  error: string | null;
  reviewIndex: number;
  revealed: boolean;
  reviewDone: boolean;
}
