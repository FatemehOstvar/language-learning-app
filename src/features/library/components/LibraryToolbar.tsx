import { Menu, Search, X } from 'lucide-react';
import { LESSON_TYPE_OPTIONS } from '@/features/library/config/libraryConfig';
import type { LessonTypeFilter } from '@/features/library/model/types';

interface LibraryToolbarProps {
  activeViewName: string;
  visibleCount: number;
  search: string;
  typeFilter: LessonTypeFilter;
  canReorder: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: LessonTypeFilter) => void;
  onOpenFolders: () => void;
}

export default function LibraryToolbar({
  activeViewName,
  visibleCount,
  search,
  typeFilter,
  canReorder,
  onSearchChange,
  onTypeFilterChange,
  onOpenFolders,
}: LibraryToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4">
      <button
        type="button"
        onClick={onOpenFolders}
        aria-label="Folders"
        className="rounded-lg border border-slate-200 p-2 text-slate-500 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <span className="truncate text-sm font-medium text-slate-900">{activeViewName}</span>
        <span className="ml-2 text-xs tabular-nums text-slate-400">{visibleCount}</span>
        {canReorder && <span className="ml-2 text-[10px] text-slate-300">drag</span>}
      </div>

      <div className="relative w-40 sm:w-52">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-xs text-slate-800 outline-none focus:border-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <select
        value={typeFilter}
        onChange={(event) =>
          onTypeFilterChange(event.target.value as LessonTypeFilter)
        }
        aria-label="Type"
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-slate-400"
      >
        {LESSON_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
