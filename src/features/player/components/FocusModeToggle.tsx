import { Maximize2, Minimize2 } from 'lucide-react';

interface FocusModeButtonProps {
  active: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({
  active,
  onToggle,
}: FocusModeButtonProps) {
  const label = active ? 'Exit focus mode' : 'Enter focus mode';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={active}
      title={active ? 'Exit focus mode (Esc)' : 'Focus on lesson'}
      className={`fixed right-2 z-[10000] flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900 focus:opacity-100 ${
        active
          ? 'top-2 opacity-25 hover:opacity-100'
          : 'top-[72px] opacity-70 hover:opacity-100'
      }`}
    >
      {active ? (
        <Minimize2 className="h-3.5 w-3.5" />
      ) : (
        <Maximize2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
