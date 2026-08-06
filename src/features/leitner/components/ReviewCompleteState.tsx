import { CheckCircle2 } from 'lucide-react';
import { LEITNER_COPY } from '@/features/leitner/config/pageConfig';

interface LeitnerReviewCompleteProps {
  onExit: () => void;
}

export default function ReviewCompleteState({
  onExit,
}: LeitnerReviewCompleteProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-slate-900">
        {LEITNER_COPY.completeTitle}
      </h2>

      <p className="mb-6 text-slate-500">
        {LEITNER_COPY.completeDescription}
      </p>

      <button
        type="button"
        onClick={onExit}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700"
      >
        {LEITNER_COPY.backToLeitner}
      </button>
    </div>
  );
}
