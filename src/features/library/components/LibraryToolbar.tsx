import {
  Menu,
  Search,
  X,
} from 'lucide-react';
import {
  LESSON_TYPE_OPTIONS,
} from '@/features/library/config/libraryConfig';
import type {
  LessonTypeFilter,
} from '@/features/library/model/types';

interface LibraryToolbarProps {
  activeViewName: string;
  visibleCount: number;
  search: string;
  typeFilter: LessonTypeFilter;
  canReorder: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (
    value: LessonTypeFilter,
  ) => void;
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
    <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onOpenFolders}
          aria-label="Open folders"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {activeViewName}
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            {visibleCount}{' '}
            {visibleCount === 1
              ? 'lesson'
              : 'lessons'}
            {canReorder
              ? ' · drag to reorder'
              : ''}
          </p>
        </div>

        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search lessons"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                onSearchChange('')
              }
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(
              event.target
                .value as LessonTypeFilter,
            )
          }
          aria-label="Filter lesson type"
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 outline-none focus:border-slate-400"
        >
          {LESSON_TYPE_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
}
