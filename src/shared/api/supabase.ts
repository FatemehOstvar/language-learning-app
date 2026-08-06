import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);

export type MediaType =
  | 'audio'
  | 'text'
  | 'document'
  | 'audio_document';

export type DocumentType =
  | 'pdf'
  | 'epub';

export interface MediaFile {
  id: string;
  title: string;
  media_type: MediaType;

  // Used by all lessons containing audio
  audio_url: string | null;
  audio_filename: string | null;

  // Used by audio + SRT lessons
  srt_content: string | null;
  srt_filename: string | null;

  // Used by pasted-text lessons
  content: string | null;
  source_filename: string | null;

  // Used by PDF and EPUB lessons
  document_url: string | null;
  document_filename: string | null;
  document_type: DocumentType | null;

  created_at: string;
}