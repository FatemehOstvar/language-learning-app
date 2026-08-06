import {
  Brain,
  CheckCircle2,
  Inbox,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import type { WordStatus } from '@/features/vocabulary/api/leitner';

interface StatusOption {
  value: WordStatus;
  label: string;
  shortcut: string;
  icon: LucideIcon;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'leitner',
    label: 'Leitner',
    shortcut: 'A',
    icon: Brain,
  },
  {
    value: 'unlearned',
    label: 'Unlearned',
    shortcut: 'S',
    icon: Inbox,
  },
  {
    value: 'learned',
    label: 'Learned',
    shortcut: 'D',
    icon: CheckCircle2,
  },
];

interface WordStatusSelectorProps {
  savingStatus: WordStatus | null;
  disabled: boolean;
  onSelect: (status: WordStatus) => void | Promise<void>;
}

export default function WordStatusSelector({
  savingStatus,
  disabled,
  onSelect,
}: WordStatusSelectorProps) {
  return (
    <div
      className="grid gap-1"
      role="group"
      aria-label="Save word status"
    >
      {STATUS_OPTIONS.map((option) => {
        const Icon = option.icon;
        const saving = savingStatus === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => {
              void onSelect(option.value);
            }}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2 text-left text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600" />
            ) : (
              <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            )}

            <span className="min-w-0 flex-1 truncate text-xs font-semibold">
              {option.label}
            </span>

            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {option.shortcut}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
