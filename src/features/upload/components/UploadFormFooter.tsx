import { Loader2, UploadCloud } from 'lucide-react';

interface UploadFormFooterProps {
  uploading: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export default function UploadFormFooter({
  uploading,
  canSubmit,
  onSubmit,
}: UploadFormFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="text-xs leading-5 text-slate-400">
        Files are uploaded securely to your Supabase storage.
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            Create lesson
          </>
        )}
      </button>
    </div>
  );
}
