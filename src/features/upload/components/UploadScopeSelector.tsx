import { BookCopy, BookOpen, Layers3, type LucideIcon } from 'lucide-react';
import type { UploadScope } from '@/features/upload/model/types';

interface UploadScopeSelectorProps {
  value: UploadScope;
  onChange: (scope: UploadScope) => void;
}

const SCOPES: Array<{ id: UploadScope; label: string; icon: LucideIcon }> = [
  { id: 'lesson', label: 'Lesson', icon: BookOpen },
  { id: 'book', label: 'Book', icon: BookCopy },
  { id: 'series', label: 'Series', icon: Layers3 },
];

export default function UploadScopeSelector({
  value,
  onChange,
}: UploadScopeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
      {SCOPES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
              active
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
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
