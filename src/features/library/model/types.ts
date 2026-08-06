import type {
  LibraryFolder,
  MediaFile,
  MediaType,
} from '@/shared/api/supabase';

export type LibraryView =
  | { kind: 'all' }
  | { kind: 'unfiled' }
  | { kind: 'folder'; folderId: string };

export type LessonTypeFilter =
  | 'all'
  | MediaType;

export interface LessonOrderUpdate {
  id: string;
  sort_order: number;
}

export interface LibraryCounts {
  all: number;
  unfiled: number;
  byFolder: Map<string, number>;
}

export interface LibraryState {
  folders: LibraryFolder[];
  lessons: MediaFile[];
  visibleLessons: MediaFile[];
  activeView: LibraryView;
  activeViewName: string;
  typeFilter: LessonTypeFilter;
  search: string;
  loading: boolean;
  error: string | null;
  counts: LibraryCounts;
  canReorder: boolean;
}
