/*
# Create media_files table

1. New Tables
- `media_files`
  - `id` (uuid, primary key)
  - `title` (text) — display name for the file pair
  - `audio_url` (text) — URL of the audio file in Supabase Storage
  - `audio_filename` (text) — original audio filename
  - `srt_content` (text) — full text of the SRT subtitle file
  - `srt_filename` (text) — original SRT filename
  - `created_at` (timestamptz) — upload timestamp

2. Security
- Enable RLS.
- Allow anon + authenticated full CRUD (single-tenant, no sign-in required).

3. Notes
- Audio files are stored in Supabase Storage bucket "audio".
- SRT content is stored inline in the database for fast access.
*/

CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  audio_url text NOT NULL,
  audio_filename text NOT NULL,
  srt_content text NOT NULL,
  srt_filename text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_media_files" ON media_files;
CREATE POLICY "anon_select_media_files" ON media_files FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_media_files" ON media_files;
CREATE POLICY "anon_insert_media_files" ON media_files FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_media_files" ON media_files;
CREATE POLICY "anon_update_media_files" ON media_files FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_media_files" ON media_files;
CREATE POLICY "anon_delete_media_files" ON media_files FOR DELETE
  TO anon, authenticated USING (true);
