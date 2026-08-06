import { FolderPlus } from 'lucide-react';

interface LibraryHeaderProps {
  lessonCount: number;
  onCreateFolder: () => void;
}

export default function LibraryHeader({
  lessonCount,
  onCreateFolder,
}: LibraryHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Library
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Your lessons
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {lessonCount}{' '}
          {lessonCount === 1 ? 'lesson' : 'lessons'}
        </p>
      </div>

      <button
        type="button"
        onClick={onCreateFolder}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <FolderPlus className="h-4 w-4" />
        <span className="hidden sm:inline">
          New folder
        </span>
      </button>
    </header>
  );
}
