import {
  Brain,
  CheckCircle2,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import type { WordStatus } from '@/lib/leitner';

interface StatusOption {
  value: WordStatus;
  label: string;
  description: string;
  icon: LucideIcon;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'leitner',
    label: 'Add to Leitner',
    description: 'Review this word with spaced repetition.',
    icon: Brain,
  },
  {
    value: 'unlearned',
    label: 'Unlearned',
    description: 'Keep it marked as an unknown word.',
    icon: Inbox,
  },
  {
    value: 'learned',
    label: 'Learned',
    description: 'Mark this word as already known.',
    icon: CheckCircle2,
  },
];

interface WordStatusSelectorProps {
  value: WordStatus;
  onChange: (status: WordStatus) => void;
}

export default function WordStatusSelector({
  value,
  onChange,
}: WordStatusSelectorProps) {
  return (
    <div className="grid gap-2">
      {STATUS_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
              selected
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                selected ? 'text-emerald-700' : 'text-slate-400'
              }`}
            />

            <span className="min-w-0">
              <span
                className={`block text-sm font-medium ${
                  selected ? 'text-emerald-900' : 'text-slate-800'
                }`}
              >
                {option.label}
              </span>

              <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
