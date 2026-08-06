import {
  BookOpen,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { LeitnerWord } from '@/features/vocabulary/api/leitner';
import { LEITNER_COPY } from '@/features/leitner/config/pageConfig';

interface LeitnerReviewCardProps {
  word: LeitnerWord;
  revealed: boolean;
  onReveal: () => void;
  onReview: (remembered: boolean) => void;
}

export default function ReviewCard({
  word,
  revealed,
  onReveal,
  onReview,
}: LeitnerReviewCardProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {revealed ? (
        <RevealedWord
          word={word}
          onReview={onReview}
        />
      ) : (
        <HiddenWord
          word={word}
          onReveal={onReveal}
        />
      )}
    </div>
  );
}

function HiddenWord({
  word,
  onReveal,
}: {
  word: LeitnerWord;
  onReveal: () => void;
}) {
  return (
    <>
      <p className="mb-4 text-sm text-slate-400">
        {LEITNER_COPY.reviewQuestion}
      </p>

      <h2 className="mb-6 text-4xl font-bold capitalize text-slate-900">
        {word.word}
      </h2>

      <button
        type="button"
        onClick={onReveal}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-900"
      >
        <BookOpen className="h-4 w-4" />
        {LEITNER_COPY.revealContext}
      </button>
    </>
  );
}

function RevealedWord({
  word,
  onReview,
}: {
  word: LeitnerWord;
  onReview: (remembered: boolean) => void;
}) {
  return (
    <>
      <h2 className="mb-4 text-4xl font-bold capitalize text-slate-900">
        {word.word}
      </h2>

      {word.sentence && (
        <p className="mb-2 max-w-lg text-base leading-relaxed text-slate-600">
          &ldquo;{word.sentence}&rdquo;
        </p>
      )}

      {word.note && (
        <div className="mb-4 flex max-w-lg items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-left">
          <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="whitespace-pre-wrap text-sm leading-5 text-amber-950">
            {word.note}
          </p>
        </div>
      )}

      <p className="mb-6 text-xs text-slate-400">
        Box {word.box} of 5
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onReview(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100"
        >
          <ThumbsDown className="h-4 w-4" />
          {LEITNER_COPY.forgot}
        </button>

        <button
          type="button"
          onClick={() => onReview(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-100"
        >
          <ThumbsUp className="h-4 w-4" />
          {LEITNER_COPY.remembered}
        </button>
      </div>
    </>
  );
}
