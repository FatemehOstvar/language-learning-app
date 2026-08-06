import {
  BookOpen,
  Captions,
  Headphones,
  PenLine,
  type LucideIcon,
} from 'lucide-react';
import type { UploadTab } from '@/features/upload/model/types';

interface LessonTypeSelectorProps {
  activeTab: UploadTab;
  onChange: (tab: UploadTab) => void;
}

const LESSON_TYPES: Array<{
  id: UploadTab;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: 'audio-document',
    label: 'Audio + document',
    description: 'PDF or EPUB',
    icon: Headphones,
  },
  {
    id: 'audio-subtitle',
    label: 'Audio + subtitles',
    description: 'SRT or WebVTT',
    icon: Captions,
  },
  {
    id: 'document',
    label: 'Document',
    description: 'PDF or EPUB',
    icon: BookOpen,
  },
  {
    id: 'textbox',
    label: 'Text',
    description: 'Write or paste',
    icon: PenLine,
  },
];

export default function LessonTypeSelector({
  activeTab,
  onChange,
}: LessonTypeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Lesson type"
      className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 sm:grid-cols-4"
    >
      {LESSON_TYPES.map(({ id, label, description, icon: Icon }) => {
        const active = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-left transition ${
              active
                ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${
                active ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />

            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {label}
              </span>
              <span className="hidden truncate text-[11px] leading-4 text-slate-400 sm:block">
                {description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
