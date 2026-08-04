/*
# Create leitner_words table

1. New Tables
- `leitner_words`
  - `id` (uuid, primary key)
  - `word` (text, not null) — the word being learned, stored lowercase
  - `sentence` (text, nullable) — the sentence context where the word was saved
  - `status` (text, not null, default 'unlearned') — one of: 'unlearned', 'leitner', 'learned'
  - `box` (int, not null, default 1) — Leitner box number 1-5
  - `next_review` (date, not null, default today) — the date when the word is due for review
  - `last_reviewed` (date, nullable) — last review date
  - `review_count` (int, not null, default 0) — total reviews
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS.
- Allow anon + authenticated full CRUD (single-tenant, no sign-in required).

3. Notes
- `status` tracks the three states: 'unlearned' (blue in player), 'leitner' (yellow), 'learned' (white).
- The Leitner box system uses 5 boxes with increasing review intervals.
- `next_review` determines which words appear in "today's review".
- A unique constraint on (word) prevents duplicate entries for the same word.
*/

CREATE TABLE IF NOT EXISTS leitner_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  sentence text,
  status text NOT NULL DEFAULT 'unlearned' CHECK (status IN ('unlearned', 'leitner', 'learned')),
  box int NOT NULL DEFAULT 1 CHECK (box >= 1 AND box <= 5),
  next_review date NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed date,
  review_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leitner_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leitner_words" ON leitner_words;
CREATE POLICY "anon_select_leitner_words" ON leitner_words FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leitner_words" ON leitner_words;
CREATE POLICY "anon_insert_leitner_words" ON leitner_words FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leitner_words" ON leitner_words;
CREATE POLICY "anon_update_leitner_words" ON leitner_words FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leitner_words" ON leitner_words;
CREATE POLICY "anon_delete_leitner_words" ON leitner_words FOR DELETE
  TO anon, authenticated USING (true);
