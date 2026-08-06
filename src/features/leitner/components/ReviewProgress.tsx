import { X } from 'lucide-react';

interface LeitnerReviewProgressProps {
  index: number;
  total: number;
  progress: number;
  onExit: () => void;
}

export default function ReviewProgress({
  index,
  total,
  progress,
  onExit,
}: LeitnerReviewProgressProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit review"
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mx-4 flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span className="font-mono text-xs text-slate-400">
        {index + 1}/{total}
      </span>
    </div>
  );
}
