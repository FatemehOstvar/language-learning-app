import { Loader2 } from 'lucide-react';
import type { UploadTab } from '@/lib/uploadTypes';

interface UploadStatusProps {
  tab: UploadTab;
  uploading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

export default function UploadStatus({
  tab,
  uploading,
  progress,
  message,
  error,
}: UploadStatusProps) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {uploading && tab !== 'textbox' && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              {message || 'Uploading…'}
            </div>
            <span className="font-mono text-xs text-slate-500">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploading && tab === 'textbox' && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          {message || 'Creating lesson…'}
        </div>
      )}
    </>
  );
}
