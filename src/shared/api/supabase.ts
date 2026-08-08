import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MediaType =
  | 'audio'
  | 'text'
  | 'document'
  | 'audio_document';

export type DocumentType = 'pdf' | 'epub';

// Matches the existing library_folders table exactly.
export interface LibraryFolder {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

// Database-backed fields match media_files. The document_* fields are
// client-only aliases hydrated from content/source_filename for the player.
export interface MediaFile {
  id: string;
  title: string;
  audio_url: string | null;
  audio_filename: string | null;
  srt_content: string | null;
  srt_filename: string | null;
  created_at: string;
  media_type: MediaType;
  content: string | null;
  source_filename: string | null;
  folder_id: string | null;
  sort_order: number;

  document_url?: string | null;
  document_filename?: string | null;
  document_type?: DocumentType | null;
}
