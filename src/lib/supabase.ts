import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MediaType = 'audio' | 'text';

export interface MediaFile {
  id: string;
  title: string;
  audio_url: string | null;
  audio_filename: string | null;
  srt_content: string | null;
  srt_filename: string | null;
  media_type: MediaType;
  content: string | null;
  source_filename: string | null;
  created_at: string;
}
