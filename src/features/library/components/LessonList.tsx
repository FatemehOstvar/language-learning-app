import {
  BookOpen,
  FolderInput,
} from 'lucide-react';
import LessonRow from '@/features/library/components/LessonRow';
import type {
  MediaFile,
} from '@/shared/api/supabase';

interface LessonListProps {
  lessons: MediaFile[];
  activeId: string | null;
  canReorder: boolean;
  hasSearchOrFilter: boolean;
  onOpen: (lesson: MediaFile) => void;
  onRename: (
    id: string,
    title: string,
  ) => Promise<boolean>;
  onMove: (
    lesson: MediaFile,
  ) => void;
  onDelete: (
    lesson: MediaFile,
  ) => void;
  onReorder: (
    draggedId: string,
    targetId: string,
  ) => Promise<void>;
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
    return (
      <div className="flex min-h-72 items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            {hasSearchOrFilter ? (
              <BookOpen className="h-5 w-5" />
            ) : (
              <FolderInput className="h-5 w-5" />
            )}
          </div>

          <h3 className="mt-3 text-sm font-semibold text-slate-800">
            {hasSearchOrFilter
              ? 'No matching lessons'
              : 'This folder is empty'}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {hasSearchOrFilter
              ? 'Try a different search or lesson type.'
              : 'Drag lessons here or use the Move action.'}
          </p>
        </div>
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
