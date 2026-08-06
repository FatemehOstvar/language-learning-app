import { Brain, ChevronRight } from 'lucide-react';
import {
  formatDueCount,
  LEITNER_COPY,
} from '@/features/leitner/config/pageConfig';

interface TodayReviewCardProps {
  count: number;
  onStart: () => void;
}

export default function DueReviewCard({
  count,
  onStart,
}: TodayReviewCardProps) {
  const hasWords = count > 0;

  return (
    <section
      className={`mb-6 rounded-2xl border p-5 transition-all ${
        hasWords
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              hasWords
                ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Brain className="h-6 w-6" />
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              {LEITNER_COPY.todayTitle}
            </p>

            <p className="text-sm text-slate-500">
              {hasWords ? formatDueCount(count) : LEITNER_COPY.noWordsDue}
            </p>
          </div>
        </div>

        {hasWords && (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-700"
          >
            {LEITNER_COPY.startReview}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
