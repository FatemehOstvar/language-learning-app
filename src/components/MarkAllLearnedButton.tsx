import { CheckCircle2, Loader2 } from 'lucide-react';

interface MarkAllLearnedButtonProps {
  allMarked: boolean;
  markingAll: boolean;
  onClick: () => void;
}

export function MarkAllLearnedButton({
  allMarked,
  markingAll,
  onClick,
}: MarkAllLearnedButtonProps) {
  return (
    <div className="mt-8 flex justify-center">
      {allMarked ? (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          All words marked as learned!
        </div>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={markingAll}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Marking words...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              I know all the words here
            </>
          )}
        </button>
      )}
    </div>
  );
}
