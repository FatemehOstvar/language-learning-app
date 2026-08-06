import type { MediaFile } from '@/shared/api/supabase';

export type UploadTab =
  | 'audio-document'
  | 'audio-subtitle'
  | 'document'
  | 'textbox';
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

export interface UploadPageProps {
  onUploaded: (file: MediaFile) => void;
  onGoToPlayer: () => void;
}
