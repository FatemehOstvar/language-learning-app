import { ArrowRight, Check } from 'lucide-react';

interface UploadSuccessNoticeProps {
  visible: boolean;
  onOpenLesson: () => void;
  message?: string;
  actionLabel?: string;
}

export default function UploadSuccessNotice({
  visible,
  onOpenLesson,
  message = 'Done',
  actionLabel = 'Open',
}: UploadSuccessNoticeProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5" />
        {message}
      </span>
      <button type="button" onClick={onOpenLesson} className="inline-flex items-center gap-1 font-medium">
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
