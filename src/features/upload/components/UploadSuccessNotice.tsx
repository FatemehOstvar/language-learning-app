import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface UploadSuccessNoticeProps {
  visible: boolean;
  onOpenLesson: () => void;
}

export default function UploadSuccessNotice({
  visible,
  onOpenLesson,
}: UploadSuccessNoticeProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-emerald-900">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>Lesson created successfully.</span>
      </div>

      <button
        type="button"
        onClick={onOpenLesson}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-emerald-800 transition hover:text-emerald-950 sm:self-auto"
      >
        Open lesson
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
