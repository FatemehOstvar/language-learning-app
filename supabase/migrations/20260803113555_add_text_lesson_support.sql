/*
# Add text-only lesson support

1. Modified Tables
- `media_files`
  - `audio_url` — relaxed to nullable (text-only lessons have no audio)
  - `audio_filename` — relaxed to nullable
  - `srt_content` — relaxed to nullable
  - `srt_filename` — relaxed to nullable
  - `media_type` (text, NOT NULL, default 'audio') — 'audio' or 'text'
  - `content` (text, nullable) — raw extracted text for text-only lessons
  - `source_filename` (text, nullable) — original uploaded file name for text lessons

2. Security
- No policy changes. Existing anon + authenticated CRUD policies cover new columns automatically.

3. Notes
- Existing rows default to media_type='audio' so they keep working unchanged.
- Text-only lessons store their content inline (like SRT content does for audio lessons).
- No data is lost: only NOT NULL constraints are relaxed, no columns dropped or retyped.
*/

ALTER TABLE media_files ALTER COLUMN audio_url DROP NOT NULL;
ALTER TABLE media_files ALTER COLUMN audio_filename DROP NOT NULL;
ALTER TABLE media_files ALTER COLUMN srt_content DROP NOT NULL;
ALTER TABLE media_files ALTER COLUMN srt_filename DROP NOT NULL;

ALTER TABLE media_files ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'audio';
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS source_filename text;
