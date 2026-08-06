import { Loader2 } from 'lucide-react';

interface WordPopupSaveButtonProps {
  saving: boolean;
  disabled: boolean;
  onClick: () => void | Promise<void>;
}

export default function WordPopupSubmitButton({
  saving,
  disabled,
  onClick,
}: WordPopupSaveButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      disabled={saving || disabled}
      className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      <span>{saving ? 'Saving…' : 'Save'}</span>
      {!saving && (
        <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px]">
          Ctrl+S
        </kbd>
      )}
    </button>
  );
}
