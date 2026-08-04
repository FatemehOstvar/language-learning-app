# LinguaLab — Language Learning App (Prototype)

## Overview
A web app for language learners to practice listening and reading. Users upload audio + subtitle (.srt) pairs for listening practice, or add text-based lessons (PDF, EPUB, TXT files, or pasted text) for reading practice. All lessons are stored in the library and can be revisited anytime.

## Pages (4)
1. **Add Lesson** — Three ways to create a lesson:
   - **Audio + SRT** — Drop or browse for an audio file and a .srt subtitle file. Both are saved to the backend.
   - **Text File** — Upload a PDF, EPUB, TXT, or Markdown file. Text is extracted automatically.
   - **Text Box** — Paste or type lesson text directly into an input field with a custom title.
2. **Player / Reader** — The main practice screen.
   - For audio lessons: shows the full subtitle transcript; the audio plays in sync.
   - For text-only lessons: shows the text as readable sentences with copy-on-click.
3. **Library** — Lists all previously uploaded lessons (audio and text). Click to open; delete to remove. Different icons distinguish audio vs text lessons.
4. **Leitner** — Spaced-repetition vocabulary system. Shows today's due review count, three word lists (In Leitner, Learned, Unlearned), and a review mode for practicing due words.

## Features
- Drag-and-drop or file-picker selection for audio and .srt files (Upload page).
- Upload progress shown as a live percentage bar and on the upload button.
- Click a sentence in the transcript → audio jumps to that sentence's start time and plays.
- Press Space → audio pauses/plays (global keyboard shortcut).
- Type a number → audio jumps to that minute (supports multi-digit, e.g. "12" → 12:00).
- Click a word → a popup appears asking "Do you want to learn this?" with three choices: add to Leitner, already know it, or don't learn it. The word and its sentence context are saved.
- The sentence currently being read by the audio is highlighted green.
- Words are color-coded by Leitner status: learned words appear white, Leitner words appear yellow, unlearned words appear blue, and unknown words appear in default text color.
- Subtitles flow inline as continuous text; a line break only appears after a sentence ending with a period.
- No per-sentence timestamps shown in the reading view.
- Sticky player controls: play/pause, skip ±10s, progress bar with timestamps.
- Sentences are grouped so each green highlight ends with a period; the playing sentence stays in view at all times while the page drifts gently. Auto-scroll can be toggled on/off from the player controls.
- When the viewport is narrow (e.g. zoomed in), the player controls collapse into a vertical bar on the left side so text never goes underneath them.
- Library shows cue count (audio) or word count (text) and upload date; supports deletion.
- Text-only lessons support click-to-copy sentence and click-word for Leitner popup.
- PDF and EPUB text extraction happens client-side; extracted text is split into sentences and stored in the database.
- Leitner system uses 5 boxes with increasing review intervals (1, 2, 4, 8, 16 days). Correct answers promote a word to the next box; wrong answers demote it. Words reaching box 5 graduate to "learned" status.
- The Leitner page shows three lists: words currently in the Leitner system (with box number and next review date), learned words, and unlearned/skipped words. Each list supports deletion.
- Review mode shows due words one at a time: first the word alone, then a "reveal context" button to see the sentence, then thumbs up/down to score recall.

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS for styling
- Lucide React for icons
- Supabase (Postgres + Storage) for persistence
  - `media_files` table stores metadata + content inline
  - `audio` Storage bucket holds audio files
  - RLS enabled, anon+authenticated access (single-tenant, no auth)
- pdfjs-dist for PDF text extraction
- epubjs for EPUB text extraction

## Data Model
**leitner_words**
| column | type | description |
|---|---|---|
| id | uuid (pk) | auto-generated |
| word | text (unique) | the word being learned, stored lowercase |
| sentence | text (nullable) | sentence context where the word was saved |
| status | text | 'unlearned', 'leitner', or 'learned' (default 'unlearned') |
| box | int | Leitner box 1-5 (default 1) |
| next_review | date | when the word is due for review |
| last_reviewed | date (nullable) | last review date |
| review_count | int | total reviews (default 0) |
| created_at | timestamptz | creation time |

**media_files**
| column | type | description |
|---|---|---|
| id | uuid (pk) | auto-generated |
| title | text | display name for the lesson |
| media_type | text | 'audio' or 'text' (default 'audio') |
| audio_url | text (nullable) | public URL in Supabase Storage (audio only) |
| audio_filename | text (nullable) | original audio filename (audio only) |
| srt_content | text (nullable) | full SRT file content (audio only) |
| srt_filename | text (nullable) | original SRT filename (audio only) |
| content | text (nullable) | extracted sentence text (text lessons only) |
| source_filename | text (nullable) | original uploaded file name (text lessons only) |
| created_at | timestamptz | upload time |

## Future Enhancements (not yet built)
- Playback speed control
- Waveform visualization
- Multi-user accounts
