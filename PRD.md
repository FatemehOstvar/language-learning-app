# Product Requirements Document

## Language Learning App — Current Version

**Document status:** Current-state PRD  
**Version:** 0.1  
**Date:** 2026-08-06  
**Primary platform:** Responsive web application  
**Technology:** React, TypeScript, Vite, Tailwind CSS, Supabase

---

## 1. Product Summary

The Language Learning App helps learners study authentic material through audio, transcripts, pasted text, PDF files, and EPUB books.

The product combines four core activities:

1. Import or create a lesson.
2. Read or listen in a focused lesson player.
3. Mark unfamiliar words while studying.
4. Review saved words through a Leitner spaced-repetition workflow.

The current product is designed primarily for individual self-study. It prioritizes distraction-free reading, synchronized listening, lightweight vocabulary capture, and simple review scheduling.

---

## 2. Problem Statement

Language learners often need several disconnected tools to:

- play audio,
- follow subtitles,
- read documents,
- collect unfamiliar vocabulary,
- preserve sentence context,
- write personal notes,
- and review words later.

Switching between those tools interrupts attention and makes vocabulary collection tedious.

The app solves this by keeping lesson consumption and vocabulary review in one workflow. A learner can open a lesson, click a word, classify it, add a note, and later review it without leaving the application.

---

## 3. Product Goals

### 3.1 Primary goals

- Provide a focused environment for reading and listening.
- Support common self-study lesson formats.
- Allow vocabulary to be captured directly from lesson context.
- Provide a simple, understandable spaced-repetition workflow.
- Keep controls visually minimal during study.
- Preserve original uploaded documents.
- Organize the codebase so each feature can be changed independently.

### 3.2 Secondary goals

- Work well on desktop and smaller screens.
- Support keyboard-driven playback.
- Make lesson creation understandable without technical knowledge.
- Keep word status and review state persistent through Supabase.

### 3.3 Non-goals for the current version

The current version does not aim to provide:

- AI translation or dictionary definitions,
- speech recognition or pronunciation scoring,
- teacher dashboards,
- social or collaborative features,
- course authoring,
- gamification,
- offline synchronization,
- native mobile applications,
- or advanced learning analytics.

---

## 4. Target User

### Primary persona: Independent language learner

The primary user:

- studies from podcasts, recordings, transcripts, articles, PDFs, or EPUB books;
- wants to remain focused on the lesson;
- needs a quick way to collect unfamiliar words;
- values sentence context and personal notes;
- and wants a lightweight daily review process.

### Typical user needs

- “Let me listen and follow the text without a distracting interface.”
- “Let me click a word and save it without leaving the lesson.”
- “Let me add my own translation, mnemonic, or grammar note.”
- “Show me only the words that are due for review.”
- “Keep my uploaded lessons available in a library.”

---

## 5. Core User Journeys

### 5.1 Create a text lesson

1. The learner opens the upload page.
2. The learner selects **Text lesson**.
3. The learner enters a title.
4. The learner pastes or writes text.
5. The app normalizes the text and divides it into displayable sentences.
6. The lesson is stored in `media_files`.
7. The learner opens the lesson in the player.

### 5.2 Create an audio-document lesson

1. The learner selects **Audio lesson**.
2. The learner chooses an audio file.
3. The learner chooses a PDF or EPUB companion document.
4. The app validates both files.
5. Upload progress is displayed.
6. The original files are uploaded to Supabase Storage.
7. A lesson record is created in `media_files`.
8. The learner opens the audio and document together.

### 5.3 Study a synchronized audio lesson

1. The learner opens an audio lesson containing SRT data.
2. The app parses subtitle cues and groups them into sentences.
3. Audio playback determines the active sentence.
4. The active sentence is subtly highlighted.
5. Auto-follow scrolls only when the active sentence leaves the comfortable reading area.
6. The learner can seek by clicking a sentence.
7. The learner can click individual words to save them.

### 5.4 Save a vocabulary word

1. The learner clicks a word in a text or transcript lesson.
2. A popup displays the normalized word and source sentence.
3. The learner chooses:
   - **Add to Leitner**
   - **Unlearned**
   - **Learned**
4. When **Add to Leitner** is selected, the learner may add an optional note.
5. The app inserts or updates the word in `leitner_words`.
6. The lesson refreshes tracked-word highlighting.

### 5.5 Complete a daily review

1. The learner opens the Leitner page.
2. The app loads words whose `next_review` date is today or earlier.
3. The learner starts the review.
4. The app shows one word at a time.
5. The learner reveals the sentence and optional note.
6. The learner selects **Forgot** or **Remembered**.
7. The app updates the box, next review date, review count, and status.
8. After the final word, the app shows a completion state.

---

## 6. Functional Requirements

## 6.1 Lesson creation

### Supported creation modes

The upload interface must support:

- audio with a PDF or EPUB companion document,
- standalone PDF or EPUB document,
- pasted or written text.

### File validation

The app must accept the following audio extensions:

- MP3
- M4A
- WAV
- OGG
- AAC
- FLAC
- WebM

The app must accept the following document extensions:

- PDF
- EPUB

Invalid files must produce a readable error before upload.

### Upload behavior

- Audio files must be stored in the `audio` bucket.
- Documents must be stored in the `documents` bucket.
- Upload progress must be shown for file-based lessons.
- If lesson creation fails after one or more files have uploaded, the app should attempt to remove those uploaded files.
- The original PDF or EPUB must be preserved rather than flattened or converted.
- The lesson title must be required.
- The submit button must remain disabled until the selected lesson type has all required fields.

### Text processing

For text lessons, the app must:

- normalize whitespace,
- split content into sentences,
- ensure display consistency,
- and store the processed text in the lesson record.

---

## 6.2 Lesson library

The library must:

- load lessons from `media_files`,
- sort lessons by newest first,
- show the lesson title,
- show the creation date,
- distinguish audio and reading lessons visually,
- show a basic cue or word count where available,
- allow a lesson to be selected,
- indicate the currently active lesson,
- and allow lessons to be deleted.

Deletion must remove the database record. Storage cleanup should remove associated uploaded files where supported.

---

## 6.3 Lesson player

### Lesson routing

The player must render the correct experience for these media types:

- `audio`
- `audio_document`
- `document`
- `text`

### Text lesson

The text reader must:

- render sentence-based content,
- allow a sentence to be copied by clicking it,
- briefly confirm the copied sentence visually,
- allow individual word selection,
- display tracked-word highlighting,
- and provide an action to mark all lesson words as learned.

### Audio lesson

The synchronized audio player must:

- load the audio URL,
- parse stored SRT content,
- group subtitle cues into sentences,
- highlight the active sentence,
- seek and play when a sentence is clicked,
- support play, pause, skip backward, skip forward, and timeline seeking,
- display current time and total duration,
- support auto-follow scrolling,
- and support word selection in the transcript.

### Auto-follow behavior

Auto-follow must:

- react when the active sentence changes,
- keep the page stationary while the sentence is comfortably visible,
- smoothly reposition the active sentence when needed,
- target a comfortable reading area near the upper portion of the viewport,
- avoid continuous background drift,
- and respect reduced-motion preferences where possible.

### Audio-document lesson

The audio-document experience must:

- display a PDF or EPUB,
- provide audio playback controls,
- allow timeline seeking,
- and keep the audio controls compact so the document remains dominant.

### Document lesson

The document reader must:

- display PDFs through an embedded viewer,
- display EPUBs through `epubjs`,
- support previous and next navigation for EPUB,
- support EPUB font-size adjustment,
- show loading and failure states,
- and provide a link to open the original file.

---

## 6.4 Focus mode

The player must provide a focus mode intended for distraction-free study.

When enabled, focus mode must:

- cover the application viewport,
- hide the application navigation,
- prioritize lesson text or document content,
- retain only essential playback controls,
- use muted, low-attention control colors,
- provide a visible but unobtrusive exit control,
- and allow exiting with the Escape key.

Playback controls in focus mode should visually resemble neutral text-navigation tools rather than a prominent media player.

---

## 6.5 Playback controls and shortcuts

The audio transport must provide:

- play or pause,
- skip backward by 10 seconds,
- skip forward by 10 seconds,
- seek through a range control,
- current time,
- total time,
- auto-follow toggle where applicable,
- and focus-mode toggle where applicable.

Keyboard behavior for synchronized audio lessons must include:

- **Space:** play or pause.
- **Number input:** jump to the corresponding minute after a short input delay.
- Keyboard shortcuts must not activate while typing in an input, textarea, or editable element.

---

## 6.6 Vocabulary tracking

### Word normalization

Before persistence or lookup, words must:

- be converted to lowercase,
- remove unsupported punctuation,
- preserve letters, numbers, apostrophes, and hyphens,
- and be trimmed.

### Supported statuses

Each word must have one of three statuses:

- `unlearned`
- `leitner`
- `learned`

### Word popup

The word popup must:

- display the selected word,
- display the source sentence,
- allow status selection,
- allow an optional note when the word is added to Leitner,
- close when the user clicks outside,
- close when Escape is pressed,
- stay inside the browser viewport,
- display save progress,
- and display errors without closing.

### Notes

- Notes must be optional.
- Notes must be stored as text.
- Notes should support translations, grammar reminders, mnemonics, or other learner-created context.
- Notes must be displayed during review.
- Notes must be displayed in the Leitner overview list.

### Lesson highlighting

Tracked words must be visually distinguishable:

- Leitner words use an amber highlight.
- Unlearned words use a blue highlight.
- Learned and untracked words remain visually neutral.

---

## 6.7 Mark all words as learned

Text and transcript lessons must provide an action to mark all visible lesson words as learned.

The operation must:

- normalize all words,
- remove duplicates,
- skip words already in Leitner,
- skip words already learned,
- convert existing unlearned entries to learned,
- insert missing words as learned,
- and refresh tracked-word state after completion.

This action must not remove words from the Leitner system.

---

## 6.8 Leitner review system

### Review intervals

The current five-box schedule is:

| Box | Interval |
|---|---:|
| 1 | 1 day |
| 2 | 2 days |
| 3 | 4 days |
| 4 | 8 days |
| 5 | 16 days |

### Due-word selection

A word is due when:

- its status is `leitner`, and
- `next_review` is today or earlier.

Due words must be sorted by earliest review date first.

### Review outcomes

When the learner selects **Remembered**:

- increment the box by one, up to box 5;
- schedule the next review using the interval for the new box;
- and mark the word as learned when it reaches box 5.

When the learner selects **Forgot**:

- decrement the box by one, but never below box 1;
- keep the word in Leitner;
- and schedule the next review using the interval for the resulting box.

Every completed review must update:

- `box`
- `status`
- `next_review`
- `last_reviewed`
- `review_count`

### Overview

The Leitner overview must display:

- number of words due today,
- a start-review action when words are due,
- all current Leitner words,
- all unlearned words,
- box number,
- next review date,
- sentence context,
- optional note,
- and word deletion.

---

## 7. UX and Design Requirements

### 7.1 General principles

The interface should be:

- focused,
- quiet,
- readable,
- responsive,
- and easy to operate while listening.

Primary study content must remain visually dominant over navigation and controls.

### 7.2 Visual hierarchy

- Large lesson text is acceptable and should not enlarge transport controls.
- Playback controls must use fixed compact dimensions.
- In focus mode, controls should use white, transparent, or slate-gray surfaces.
- Green should be reserved for actions or states that need emphasis outside focus mode.
- Active transcript highlighting should be subtle.
- Error states should be visible without overwhelming the lesson.

### 7.3 Accessibility

The current UI should maintain:

- semantic button elements,
- descriptive `aria-label` values,
- visible focus behavior,
- keyboard support,
- sufficient contrast,
- and loading indicators.

Dialog-like popups should be dismissible through both pointer and keyboard interaction.

---

## 8. Data Model

## 8.1 `media_files`

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Lesson identifier |
| `title` | Text | User-facing lesson title |
| `media_type` | Text | `audio`, `text`, `document`, or `audio_document` |
| `audio_url` | Text, nullable | Public audio URL |
| `audio_filename` | Text, nullable | Original audio filename |
| `srt_content` | Text, nullable | Subtitle content for synchronized audio |
| `srt_filename` | Text, nullable | Original subtitle filename |
| `content` | Text, nullable | Processed text lesson content |
| `source_filename` | Text, nullable | Source text filename |
| `document_url` | Text, nullable | PDF or EPUB URL |
| `document_filename` | Text, nullable | Original document filename |
| `document_type` | Text, nullable | `pdf` or `epub` |
| `created_at` | Timestamp | Creation date |

## 8.2 `leitner_words`

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Word record identifier |
| `word` | Text, unique | Normalized vocabulary item |
| `sentence` | Text, nullable | Source context |
| `note` | Text, nullable | Learner-created note |
| `status` | Text | `unlearned`, `leitner`, or `learned` |
| `box` | Integer | Current Leitner box |
| `next_review` | Date | Next due date |
| `last_reviewed` | Date, nullable | Most recent review date |
| `review_count` | Integer | Number of completed reviews |
| `created_at` | Timestamp | Creation date |

---

## 9. Technical Architecture

The current frontend follows a feature-based structure.

```text
src/
├── components/
│   └── layout/
├── features/
│   ├── player/
│   ├── upload/
│   ├── leitner/
│   └── vocabulary/
├── pages/
├── shared/
│   ├── api/
│   └── utils/
├── App.tsx
└── main.tsx
```

### Feature ownership

- `features/player` owns lesson rendering, transcript behavior, playback, focus mode, and document viewers.
- `features/upload` owns lesson creation, file validation, upload progress, storage operations, and lesson creation services.
- `features/leitner` owns review-session state and review UI.
- `features/vocabulary` owns the word popup and vocabulary persistence.
- `shared` contains infrastructure and utilities used by multiple features.
- `pages` compose features and should remain thin.

### Main dependencies

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase JavaScript client
- `lucide-react`
- `epubjs`
- `pdfjs-dist`

### Environment configuration

The frontend expects:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The browser client must use a publishable or anonymous key, never a service-role secret.

---

## 10. Current Acceptance Criteria

The current release is considered functional when:

- a text lesson can be created and reopened;
- a PDF or EPUB lesson can be uploaded and displayed;
- an audio-document lesson can be uploaded and played;
- an existing SRT-backed audio lesson can display synchronized text;
- playback controls work without obscuring lesson content;
- focus mode hides the app navigation;
- auto-follow moves only when the active sentence requires repositioning;
- clicking a word opens the vocabulary popup;
- a word can be saved as unlearned, Leitner, or learned;
- a Leitner note can be saved and displayed later;
- due words can be reviewed;
- remembered and forgotten responses update scheduling;
- lessons and vocabulary survive a page reload through Supabase;
- and the production build completes without unresolved imports.

---

## 11. Known Limitations and Risks

### 11.1 Authentication and ownership

The current frontend does not demonstrate a complete authentication or per-user ownership model.

Risk:

- lessons and vocabulary may not be isolated by user unless Supabase policies and schema ownership fields are added separately.

### 11.2 Public storage URLs

Uploaded files are currently retrieved through public URLs.

Risk:

- uploaded lesson files may be accessible to anyone who obtains the URL.

### 11.3 Audio-plus-SRT creation gap

The player supports `audio` lessons with stored SRT content, but the current upload interface focuses on:

- audio plus document,
- document,
- and text.

A dedicated audio-plus-SRT creation flow is not currently exposed.

### 11.4 Storage cleanup

Database deletion and storage deletion are not yet consistently guaranteed for every lesson type.

Potential orphaned files may remain in Supabase Storage after lesson deletion or partial failures.

### 11.5 Browser document behavior

PDF rendering depends on browser iframe support. EPUB rendering depends on `epubjs` and the uploaded file being accessible with compatible browser and storage policies.

### 11.6 No automated test suite

The current project does not include a documented automated unit, integration, or end-to-end test suite.

### 11.7 Limited observability

There is no current product analytics, structured error reporting, or performance monitoring.

### 11.8 Review-model simplicity

The current “Forgot” action moves a word down one box rather than resetting it to box 1. This is an intentional current behavior but differs from some traditional Leitner implementations.

---

## 12. Recommended Next Priorities

### Priority 1 — Data safety and access

- Add authentication.
- Add `user_id` ownership to lessons and vocabulary.
- Configure and verify Row Level Security.
- Use private storage buckets with signed URLs where appropriate.
- Complete storage cleanup for every lesson type.

### Priority 2 — Product completeness

- Add a dedicated audio-plus-SRT upload workflow.
- Allow editing existing word notes and sentence context.
- Add lesson rename and edit actions.
- Add library filtering and search.
- Add review-session error recovery.

### Priority 3 — Quality

- Add unit tests for word normalization, sentence building, and review scheduling.
- Add integration tests for Supabase services.
- Add end-to-end tests for upload, playback, vocabulary capture, and review.
- Add error monitoring and basic usage analytics.

### Priority 4 — Learning enhancements

- Optional translation or dictionary integration.
- Review history and progress summaries.
- Configurable review intervals.
- Saved playback position per lesson.
- Additional subtitle formats.
- Audio speed control.

---

## 13. Success Metrics

The current version does not yet instrument product metrics. Recommended future measurements include:

- percentage of uploaded lessons successfully created,
- lesson-open-to-word-save conversion,
- average number of saved words per lesson,
- daily review completion rate,
- percentage of due words reviewed,
- review retention by Leitner box,
- player error rate,
- upload failure rate,
- and percentage of study sessions using focus mode.

---

## 14. Release Definition

The current version is an individual-study MVP that successfully connects lesson consumption, vocabulary capture, personal notes, and spaced review.

It is suitable for continued personal use and controlled testing. Before broader multi-user release, authentication, per-user data isolation, storage privacy, deletion cleanup, automated testing, and production monitoring should be treated as release requirements.
