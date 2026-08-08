import { BookOpen, FolderInput } from 'lucide-react';
import LessonRow from '@/features/library/components/LessonRow';
import type { MediaFile } from '@/shared/api/supabase';

interface LessonListProps {
  lessons: MediaFile[];
  activeId: string | null;
  canReorder: boolean;
  hasSearchOrFilter: boolean;
  onOpen: (lesson: MediaFile) => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onMove: (lesson: MediaFile) => void;
  onDelete: (lesson: MediaFile) => void;
  onReorder: (draggedId: string, targetId: string) => Promise<void>;
}

export default function LessonList({
  lessons,
  activeId,
  canReorder,
  hasSearchOrFilter,
  onOpen,
  onRename,
  onMove,
  onDelete,
  onReorder,
}: LessonListProps) {
  if (lessons.length === 0) {
    const Icon = hasSearchOrFilter ? BookOpen : FolderInput;
    return (
      <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-slate-400">
        <Icon className="h-4 w-4" />
        {hasSearchOrFilter ? 'No matches' : 'Empty'}
      </div>
    );
  }

  return (
    <div>
      {lessons.map((lesson) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          active={lesson.id === activeId}
          canReorder={canReorder}
          onOpen={onOpen}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      ))}
    </div>
  );
}
