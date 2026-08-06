import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface UploadSuccessBannerProps {
  visible: boolean;
  onOpenLesson: () => void;
}

export default function UploadSuccessNotice({
  visible,
  onOpenLesson,
}: UploadSuccessBannerProps) {
  if (!visible) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Lesson created
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Your lesson is ready to open.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenLesson}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Open lesson
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
