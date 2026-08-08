import { Plus } from 'lucide-react';

interface LibraryHeaderProps {
  lessonCount: number;
  onCreateFolder: () => void;
}

export default function LibraryHeader({
  lessonCount,
  onCreateFolder,
}: LibraryHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Library</h1>
        <span className="text-xs tabular-nums text-slate-400">{lessonCount}</span>
      </div>

      <button
        type="button"
        onClick={onCreateFolder}
        aria-label="New folder"
        title="New folder"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </header>
  );
}
