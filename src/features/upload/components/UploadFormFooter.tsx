import { Loader2 } from 'lucide-react';

interface UploadFormFooterProps {
  uploading: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  label?: string;
}

export default function UploadFormFooter({
  uploading,
  canSubmit,
  onSubmit,
  label = 'Create',
}: UploadFormFooterProps) {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {uploading ? 'Saving…' : label}
      </button>
    </footer>
  );
}
