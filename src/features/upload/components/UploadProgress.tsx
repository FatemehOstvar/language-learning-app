import { AlertCircle, Loader2 } from 'lucide-react';
import type { UploadTab } from '@/features/upload/model/types';

interface UploadProgressProps {
  tab: UploadTab;
  uploading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

export default function UploadProgress({
  tab,
  uploading,
  progress,
  message,
  error,
}: UploadProgressProps) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {message || (tab === 'textbox' ? 'Creating lesson…' : 'Uploading…')}
            </div>

            {tab !== 'textbox' && (
              <span className="tabular-nums text-slate-400">
                {progress}%
              </span>
            )}
          </div>

          {tab !== 'textbox' && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
