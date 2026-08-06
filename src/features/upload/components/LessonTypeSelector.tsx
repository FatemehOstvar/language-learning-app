import {
  BookOpen,
  Headphones,
  PenLine,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { UploadTab } from '@/features/upload/model/types';

interface LessonTypeSidebarProps {
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
    label: 'Audio lesson',
    description: 'Audio with a PDF or EPUB',
    icon: Headphones,
  },
  {
    id: 'document',
    label: 'Document lesson',
    description: 'PDF or EPUB without audio',
    icon: BookOpen,
  },
  {
    id: 'textbox',
    label: 'Text lesson',
    description: 'Write or paste lesson text',
    icon: PenLine,
  },
];

export default function LessonTypeSelector({
  activeTab,
  onChange,
}: LessonTypeSidebarProps) {
  return (
    <aside>
      <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Lesson type
      </p>

      <div className="space-y-2">
        {LESSON_TYPES.map(({ id, label, description, icon: Icon }) => {
          const active = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`w-full rounded-2xl border p-4 text-left transition-all ${
                active
                  ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                  : 'border-transparent hover:border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <p
                    className={`text-sm font-semibold ${
                      active ? 'text-emerald-950' : 'text-slate-800'
                    }`}
                  >
                    {label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Original files preserved
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              PDF and EPUB files are uploaded directly without converting or
              flattening their contents.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
