import { Loader2 } from 'lucide-react';

interface WordPopupSaveButtonProps {
  saving: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function WordPopupSubmitButton({
  saving,
  disabled,
  onClick,
}: WordPopupSaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {saving ? 'Saving…' : 'Save word'}
    </button>
  );
}
