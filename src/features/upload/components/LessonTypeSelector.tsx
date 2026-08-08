import { BookOpen, Captions, Headphones, PenLine, type LucideIcon } from 'lucide-react';
import type { UploadTab } from '@/features/upload/model/types';

interface LessonTypeSelectorProps {
  activeTab: UploadTab;
  onChange: (tab: UploadTab) => void;
}

const LESSON_TYPES: Array<{ id: UploadTab; label: string; icon: LucideIcon }> = [
  { id: 'audio-document', label: 'Audio + doc', icon: Headphones },
  { id: 'audio-subtitle', label: 'Audio + subs', icon: Captions },
  { id: 'document', label: 'Document', icon: BookOpen },
  { id: 'textbox', label: 'Text', icon: PenLine },
];

export default function LessonTypeSelector({
  activeTab,
  onChange,
}: LessonTypeSelectorProps) {
  return (
    <div role="tablist" aria-label="Lesson type" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-4">
      {LESSON_TYPES.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
