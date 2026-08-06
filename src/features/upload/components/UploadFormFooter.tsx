import { Loader2 } from 'lucide-react';

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
    <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        {uploading ? 'Saving…' : 'Create lesson'}
      </button>
    </footer>
  );
}
