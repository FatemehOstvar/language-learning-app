import type { MediaFile } from '@/shared/api/supabase';

export type UploadTab =
  | 'audio-document'
  | 'audio-subtitle'
  | 'document'
  | 'textbox';

export type UploadScope = 'lesson' | 'book' | 'series';
export type BookUploadType = 'document' | 'audio-document';

export type DragTarget =
  | 'audio'
  | 'companion'
  | 'subtitle'
  | 'document'
  | null;

export type UploadAccent = 'emerald' | 'violet' | 'amber';
export type UploadDocumentType = 'pdf' | 'epub';

export interface UploadedStorageFile {
  path: string;
  publicUrl: string;
}

export interface BatchChapterDraft {
  id: string;
  title: string;
  file: File;
}

export interface BatchBookDraft {
  id: string;
  title: string;
  sourceKey: string;
  chapters: BatchChapterDraft[];
  audioFiles: File[];
  audioOffset: number;
}

export interface UploadPageProps {
  onUploaded: (file: MediaFile) => void;
  onGoToPlayer: () => void;
}
