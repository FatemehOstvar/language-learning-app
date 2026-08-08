import type { MediaFile } from '@/shared/api/supabase';
import type { DocumentSlice } from '@/shared/utils/documentSlice';

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
  slice?: DocumentSlice;
}

export interface BatchBookSource {
  file: File;
  type: UploadDocumentType;
  unitCount: number;
  detectedBy: 'pdf-outline' | 'pdf-headings' | 'pdf-manual' | 'epub-toc' | 'epub-spine';
}

export interface BatchBookDraft {
  id: string;
  title: string;
  sourceKey: string;
  chapters: BatchChapterDraft[];
  audioFiles: File[];
  audioOffset: number;
  sourceDocument?: BatchBookSource;
}

export interface UploadPageProps {
  onUploaded: (file: MediaFile) => void;
  onGoToPlayer: () => void;
}
