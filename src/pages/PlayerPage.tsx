import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import type { MediaFile } from '@/lib/supabase';
import { parseSrt, type SrtCue } from '@/lib/srtParser';
import { formatTime } from '@/lib/formatTime';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ScrollText,
  BookOpen,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import WordPopup from '@/components/WordPopup';
import {
  fetchWordsByStatus,
  normalizeWord,
  markWordsAsLearned,
  type WordStatus,
  type LeitnerWord,
} from '@/lib/leitner';
import ePub from 'epubjs';

interface PlayerPageProps {
  media: MediaFile | null;
}

interface Sentence {
  index: number;
  text: string;
  endsWithPeriod: boolean;
  cues?: SrtCue[];
  startTime?: number;
  endTime?: number;
}

interface PopupState {
  word: string;
  sentence: string;
  x: number;
  y: number;
}

interface CompactAudioControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  focusMode?: boolean;
  disabled?: boolean;
  autoScroll?: boolean;
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (seconds: number) => void;
  onToggleAutoScroll?: () => void;
  className?: string;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function useAudioPlayback(resetKey: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [resetKey]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const mediaDuration = Number.isFinite(audio.duration)
        ? audio.duration
        : duration;
      const nextTime = clamp(seconds, 0, mediaDuration || 0);

      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration],
  );

  const skip = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      seek(audio.currentTime + seconds);
    },
    [seek],
  );

  const handleTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      setCurrentTime(event.currentTarget.currentTime);
    },
    [],
  );

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      const nextDuration = event.currentTarget.duration;
      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
    },
    [],
  );

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    skip,
    seek,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
  };
}

function CompactAudioControls({
  currentTime,
  duration,
  isPlaying,
  focusMode = false,
  disabled = false,
  autoScroll,
  onTogglePlay,
  onSkip,
  onSeek,
  onToggleAutoScroll,
  className = '',
}: CompactAudioControlsProps) {
  const canSeek = !disabled && duration > 0;

  return (
    <div
      className={`flex h-[30px] items-center gap-[2px] rounded-[8px] border border-slate-200 bg-white/95 px-[4px] shadow-sm backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={() => onSkip(-10)}
        disabled={disabled}
        aria-label="Go back 10 seconds"
        title="Back 10 seconds"
        className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SkipBack className="h-[13px] w-[13px]" />
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
          focusMode
            ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
        }`}
      >
        {isPlaying ? (
          <Pause className="h-[13px] w-[13px]" />
        ) : (
          <Play className="ml-px h-[13px] w-[13px]" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onSkip(10)}
        disabled={disabled}
        aria-label="Go forward 10 seconds"
        title="Forward 10 seconds"
        className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SkipForward className="h-[13px] w-[13px]" />
      </button>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        disabled={!canSeek}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Audio position"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className="h-[2px] min-w-[56px] flex-1 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
      />

      <span className="hidden shrink-0 font-mono text-[9px] leading-none tabular-nums text-slate-400 sm:block">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {onToggleAutoScroll && (
        <button
          type="button"
          onClick={onToggleAutoScroll}
          aria-label="Toggle automatic scrolling"
          aria-pressed={autoScroll}
          title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          className={`ml-[2px] flex h-[24px] w-[24px] items-center justify-center rounded-[6px] transition ${
            autoScroll
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
        >
          <ScrollText className="h-[13px] w-[13px]" />
        </button>
      )}
    </div>
  );
}

export default function PlayerPage({ media }: PlayerPageProps) {
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    setFocusMode(false);
  }, [media?.id]);

  useEffect(() => {
    if (!focusMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusMode]);

  if (!media) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-slate-400">
          No media loaded. Upload a file or pick one from the library.
        </p>
      </div>
    );
  }

  let lesson: ReactNode = null;

  switch (media.media_type) {
    case 'audio':
      lesson = <AudioPlayer media={media} focusMode={focusMode} />;
      break;
    case 'audio_document':
      lesson = <AudioDocumentPlayer media={media} focusMode={focusMode} />;
      break;
    case 'document':
      lesson = <DocumentReader media={media} focusMode={focusMode} />;
      break;
    case 'text':
      lesson = <TextReader media={media} focusMode={focusMode} />;
      break;
  }

  return (
    <div
      className={
        focusMode
          ? 'fixed inset-0 z-[9999] overflow-y-auto bg-white'
          : 'relative'
      }
    >
      <button
        type="button"
        onClick={() => setFocusMode((current) => !current)}
        aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        aria-pressed={focusMode}
        title={focusMode ? 'Exit focus mode (Esc)' : 'Focus on lesson'}
        className={`fixed right-[8px] z-[10000] flex h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900 focus:opacity-100 ${
          focusMode
            ? 'top-[8px] opacity-25 hover:opacity-100'
            : 'top-[72px] opacity-70 hover:opacity-100'
        }`}
      >
        {focusMode ? (
          <Minimize2 className="h-[14px] w-[14px]" />
        ) : (
          <Maximize2 className="h-[14px] w-[14px]" />
        )}
      </button>

      {lesson}
    </div>
  );
}

/* ── Leitner and unlearned word loading ─────────────────────── */

function useTrackedWords() {
  const [leitnerWords, setLeitnerWords] = useState<LeitnerWord[]>([]);
  const [unlearnedWords, setUnlearnedWords] = useState<LeitnerWord[]>([]);

  const loadTrackedWords = useCallback(async () => {
    const [leitner, unlearned] = await Promise.all([
      fetchWordsByStatus('leitner'),
      fetchWordsByStatus('unlearned'),
    ]);

    setLeitnerWords(leitner);
    setUnlearnedWords(unlearned);
  }, []);

  useEffect(() => {
    void loadTrackedWords().catch((error) => {
      console.error('Failed to load tracked words:', error);
    });
  }, [loadTrackedWords]);

  const trackedWordMap = useMemo(() => {
    const map = new Map<string, LeitnerWord>();

    for (const word of leitnerWords) {
      map.set(word.word, word);
    }

    for (const word of unlearnedWords) {
      map.set(word.word, word);
    }

    return map;
  }, [leitnerWords, unlearnedWords]);

  return {
    trackedWordMap,
    loadTrackedWords,
  };
}

/* ── Shared word helpers ────────────────────────────────────── */

function getWordClass(
  word: string,
  trackedWordMap: Map<string, LeitnerWord>,
): string {
  const cleanWord = normalizeWord(word);

  if (!cleanWord) {
    return 'text-gray-950';
  }

  const entry = trackedWordMap.get(cleanWord);

  if (entry?.status === 'leitner') {
    return 'bg-amber-200 text-gray-950 font-medium';
  }

  if (entry?.status === 'unlearned') {
    return 'bg-blue-100 text-gray-950';
  }

  // Learned and untracked words are deliberately not fetched.
  return 'text-gray-950';
}

function extractWordsFromSentences(
  sentences: Sentence[],
): { word: string }[] {
  const uniqueWords = new Set<string>();

  for (const sentence of sentences) {
    const rawWords = sentence.text.split(/\s+/);

    for (const rawWord of rawWords) {
      const cleanWord = normalizeWord(rawWord);

      if (cleanWord) {
        uniqueWords.add(cleanWord);
      }
    }
  }

  return Array.from(uniqueWords, (word) => ({ word }));
}

function buildSentencesFromCues(cues: SrtCue[]): Sentence[] {
  const sentences: Sentence[] = [];
  let pendingCues: SrtCue[] = [];

  const commitSentence = () => {
    if (pendingCues.length === 0) return;

    const text = pendingCues
      .map((cue) => cue.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    sentences.push({
      index: sentences.length,
      text,
      cues: pendingCues,
      startTime: pendingCues[0].startTime,
      endTime: pendingCues[pendingCues.length - 1].endTime,
      endsWithPeriod: /[.!?]$/.test(text),
    });

    pendingCues = [];
  };

  for (const cue of cues) {
    pendingCues.push(cue);

    const text = pendingCues.map((item) => item.text).join(' ').trim();
    if (/[.!?]$/.test(text)) commitSentence();
  }

  commitSentence();
  return sentences;
}


/* ── Text reader ────────────────────────────────────────────── */

function TextReader({
  media,
  focusMode,
}: {
  media: MediaFile;
  focusMode: boolean;
}) {
  const [copiedSentence, setCopiedSentence] = useState<number | null>(
    null,
  );
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [allMarked, setAllMarked] = useState(false);

  const { trackedWordMap, loadTrackedWords } = useTrackedWords();

  const sentences = useMemo<Sentence[]>(() => {
    if (!media.content) {
      return [];
    }

    return media.content
      .split('\n')
      .map((text, index) => {
        const trimmedText = text.trim();

        return {
          index,
          text: trimmedText,
          endsWithPeriod: /[.!?]$/.test(trimmedText),
        };
      })
      .filter((sentence) => sentence.text.length > 0);
  }, [media.content]);

  useEffect(() => {
    setCopiedSentence(null);
    setPopup(null);
    setAllMarked(false);
  }, [media]);

  const handleSentenceClick = useCallback(
    (sentence: Sentence) => {
      void navigator.clipboard.writeText(sentence.text);

      setCopiedSentence(sentence.index);

      window.setTimeout(() => {
        setCopiedSentence(null);
      }, 1500);
    },
    [],
  );

  const handleWordClick = useCallback(
    (
      event: MouseEvent<HTMLElement>,
      word: string,
      sentence: string,
    ) => {
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();

      setPopup({
        word,
        sentence,
        x: rect.left,
        y: rect.bottom + 8,
      });
    },
    [],
  );

  const handlePopupSaved = useCallback(
    (_word: string, _status: WordStatus) => {
      void loadTrackedWords().catch((error) => {
        console.error('Failed to reload tracked words:', error);
      });
    },
    [loadTrackedWords],
  );

  const handleMarkAllLearned = async () => {
    setMarkingAll(true);

    try {
      const words = extractWordsFromSentences(sentences);

      if (words.length > 0) {
        await markWordsAsLearned(words);
      }

      await loadTrackedWords();
      setAllMarked(true);
    } catch (error) {
      console.error('Failed to mark words as learned:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!focusMode && (
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <BookOpen className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {media.title}
            </h1>

            {media.source_filename && (
              <p className="mt-1 text-sm text-slate-400">
                {media.source_filename}
              </p>
            )}
          </div>
        </div>
      )}


      <div className="text-[15px] leading-loose">
        {sentences.map((sentence) => {
          const words = sentence.text.split(/\s+/);
          const isCopied = copiedSentence === sentence.index;

          return (
            <span
              key={sentence.index}
              onClick={() => handleSentenceClick(sentence)}
              className={`cursor-pointer rounded px-1 py-0.5 transition-all duration-300 ${
                isCopied
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'hover:bg-slate-100'
              }`}
            >
              {words.map((word, wordIndex) => (
                <span
                  key={`${sentence.index}-${wordIndex}`}
                  onClick={(event) =>
                    handleWordClick(
                      event,
                      word,
                      sentence.text,
                    )
                  }
                  className={`cursor-pointer rounded px-0.5 transition-colors hover:underline ${getWordClass(
                    word,
                    trackedWordMap,
                  )}`}
                >
                  {word}{' '}
                </span>
              ))}

              {sentence.endsWithPeriod ? <br /> : ' '}
            </span>
          );
        })}
      </div>

      <MarkAllLearnedButton
        allMarked={allMarked}
        markingAll={markingAll}
        onClick={handleMarkAllLearned}
      />

      <div className="h-20" />

      {popup && (
        <WordPopup
          word={popup.word}
          sentence={popup.sentence}
          x={popup.x}
          y={popup.y}
          onClose={() => setPopup(null)}
          onSaved={handlePopupSaved}
        />
      )}
    </div>
  );
}

/* ── Document lesson readers ────────────────────────────────── */

interface DocumentViewerProps {
  media: MediaFile;
  className?: string;
}

interface EpubRenditionApi {
  display: (
    location?: string,
  ) => Promise<unknown>;

  prev: () => Promise<unknown>;
  next: () => Promise<unknown>;

  themes: {
    fontSize: (
      size: string,
    ) => void;
  };

  destroy?: () => void;
}

interface EpubBookApi {
  renderTo: (
    element: HTMLElement,
    options: {
      width: string;
      height: string;
      spread: 'none';
      flow: 'paginated';
    },
  ) => EpubRenditionApi;

  destroy?: () => void;
}

function DocumentReader({
  media,
  focusMode,
}: {
  media: MediaFile;
  focusMode: boolean;
}) {
  return (
    <div
      className={
        focusMode
          ? 'min-h-screen bg-white'
          : 'min-h-[calc(100vh-4rem)] bg-slate-50'
      }
    >
      <div
        className={
          focusMode
            ? 'h-screen'
            : 'mx-auto max-w-7xl px-4 py-6 sm:px-6'
        }
      >
        {!focusMode && (
          <LessonDocumentHeader
            media={media}
            description="Read the lesson document below."
          />
        )}

        <DocumentViewer
          media={media}
          className={
            focusMode
              ? 'h-screen min-h-0 rounded-none border-0 shadow-none'
              : 'h-[calc(100vh-12rem)] min-h-[600px]'
          }
        />
      </div>
    </div>
  );
}

function AudioDocumentPlayer({
  media,
  focusMode,
}: {
  media: MediaFile;
  focusMode: boolean;
}) {
  const {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    skip,
    seek,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
  } = useAudioPlayback(media.id);

  const audioDisabled = !media.audio_url;

  return (
    <div
      className={
        focusMode
          ? 'min-h-screen bg-white pb-[38px]'
          : 'min-h-screen bg-slate-50 pb-[42px]'
      }
    >
      <audio
        ref={audioRef}
        src={media.audio_url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="hidden"
      />

      <div
        className={
          focusMode
            ? 'h-[calc(100vh-38px)]'
            : 'mx-auto max-w-7xl px-4 py-6 sm:px-6'
        }
      >
        {!focusMode && (
          <LessonDocumentHeader
            media={media}
            description="Listen to the audio while following the companion document."
          />
        )}

        <DocumentViewer
          media={media}
          className={
            focusMode
              ? 'h-full min-h-0 rounded-none border-0 shadow-none'
              : 'h-[calc(100vh-13rem)] min-h-[580px]'
          }
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-[4px] py-[3px]">
          <CompactAudioControls
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            focusMode={focusMode}
            disabled={audioDisabled}
            onTogglePlay={togglePlay}
            onSkip={skip}
            onSeek={seek}
            className="border-0 bg-transparent shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

function LessonDocumentHeader({
  media,
  description,
}: {
  media: MediaFile;
  description: string;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <BookOpen className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950">
            {media.title}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>

          {media.document_filename && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {
                media.document_filename
              }
            </p>
          )}
        </div>
      </div>

      {media.document_url && (
        <a
          href={
            media.document_url
          }
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open original
        </a>
      )}
    </header>
  );
}

function DocumentViewer({
  media,
  className = '',
}: DocumentViewerProps) {
  const documentUrl =
    media.document_url;

  const documentType =
    media.document_type ??
    inferDocumentType(
      media.document_filename,
    );

  if (!documentUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-3xl border border-slate-200 bg-white ${className}`}
      >
        <div className="max-w-sm px-6 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />

          <p className="font-semibold text-slate-700">
            Document unavailable
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            This lesson does not
            contain a document URL.
          </p>
        </div>
      </div>
    );
  }

  if (
    documentType === 'pdf'
  ) {
    return (
      <PdfViewer
        url={documentUrl}
        title={media.title}
        className={className}
      />
    );
  }

  if (
    documentType === 'epub'
  ) {
    return (
      <EpubViewer
        url={documentUrl}
        title={media.title}
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-3xl border border-slate-200 bg-white ${className}`}
    >
      <div className="max-w-sm px-6 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />

        <p className="font-semibold text-slate-700">
          Unsupported document
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          This lesson must contain
          a PDF or EPUB document.
        </p>
      </div>
    </div>
  );
}

function PdfViewer({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <iframe
        src={`${url}#view=FitH`}
        title={`${title} PDF`}
        className="h-full w-full border-0"
      />
    </div>
  );
}

function EpubViewer({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className: string;
}) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const bookRef =
    useRef<EpubBookApi | null>(
      null,
    );

  const renditionRef =
    useRef<EpubRenditionApi | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [fontSize, setFontSize] =
    useState(100);

  useEffect(() => {
    let disposed = false;

    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = '';
    setLoading(true);
    setError(null);
    setFontSize(100);

    let book:
      | EpubBookApi
      | null = null;

    let rendition:
      | EpubRenditionApi
      | null = null;

    const loadBook = async () => {
      try {
        book = ePub(
          url,
        ) as unknown as EpubBookApi;

        rendition =
          book.renderTo(
            container,
            {
              width: '100%',
              height: '100%',
              spread: 'none',
              flow: 'paginated',
            },
          );

        await rendition.display();

        if (disposed) {
          rendition.destroy?.();
          book.destroy?.();
          return;
        }

        bookRef.current = book;
        renditionRef.current =
          rendition;

        rendition.themes.fontSize(
          '100%',
        );

        setLoading(false);
      } catch (loadError) {
        if (!disposed) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'The EPUB could not be opened.',
          );

          setLoading(false);
        }
      }
    };

    void loadBook();

    return () => {
      disposed = true;

      rendition?.destroy?.();
      book?.destroy?.();

      renditionRef.current =
        null;
      bookRef.current = null;

      container.innerHTML = '';
    };
  }, [url]);

  const moveToPreviousPage =
    () => {
      void renditionRef.current
        ?.prev()
        .catch((navigationError) => {
          console.error(
            'Could not open the previous EPUB page:',
            navigationError,
          );
        });
    };

  const moveToNextPage = () => {
    void renditionRef.current
      ?.next()
      .catch((navigationError) => {
        console.error(
          'Could not open the next EPUB page:',
          navigationError,
        );
      });
  };

  const changeFontSize = (
    difference: number,
  ) => {
    setFontSize(
      (currentFontSize) => {
        const nextFontSize =
          Math.max(
            70,
            Math.min(
              180,
              currentFontSize +
                difference,
            ),
          );

        renditionRef.current?.themes.fontSize(
          `${nextFontSize}%`,
        );

        return nextFontSize;
      },
    );
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 sm:px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={
              moveToPreviousPage
            }
            disabled={
              loading ||
              Boolean(error)
            }
            aria-label="Previous EPUB page"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={
              moveToNextPage
            }
            disabled={
              loading ||
              Boolean(error)
            }
            aria-label="Next EPUB page"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <p className="min-w-0 truncate px-3 text-sm font-semibold text-slate-700">
          {title}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              changeFontSize(-10)
            }
            disabled={
              loading ||
              Boolean(error)
            }
            aria-label="Decrease EPUB font size"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="w-10 text-center font-mono text-[10px] text-slate-400">
            {fontSize}%
          </span>

          <button
            type="button"
            onClick={() =>
              changeFontSize(10)
            }
            disabled={
              loading ||
              Boolean(error)
            }
            aria-label="Increase EPUB font size"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="h-full w-full bg-white"
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />

              <p className="mt-3 text-sm text-slate-500">
                Opening EPUB…
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="max-w-sm px-6 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />

              <p className="font-semibold text-slate-700">
                EPUB could not be
                displayed
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {error}
              </p>

              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <ExternalLink className="h-4 w-4" />
                Open original file
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function inferDocumentType(
  filename: string | null,
): 'pdf' | 'epub' | null {
  if (!filename) {
    return null;
  }

  const extension =
    filename
      .toLowerCase()
      .split('.')
      .pop();

  if (
    extension === 'pdf' ||
    extension === 'epub'
  ) {
    return extension;
  }

  return null;
}
/* ── Audio player ───────────────────────────────────────────── */

function AudioPlayer({
  media,
  focusMode,
}: {
  media: MediaFile;
  focusMode: boolean;
}) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const numberTimeout = useRef<number | undefined>(undefined);

  const [cues, setCues] = useState<SrtCue[]>([]);
  const [numberBuffer, setNumberBuffer] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [allMarked, setAllMarked] = useState(false);

  const {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    skip,
    seek,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
  } = useAudioPlayback(media.id);

  const { trackedWordMap, loadTrackedWords } = useTrackedWords();
  const sentences = useMemo(() => buildSentencesFromCues(cues), [cues]);

  const activeSentenceIndex = useMemo(
    () =>
      sentences.findIndex(({ startTime = 0, endTime = 0 }) =>
        currentTime >= startTime && currentTime <= endTime,
      ),
    [sentences, currentTime],
  );

  useEffect(() => {
    setCues(parseSrt(media.srt_content || ''));
    setNumberBuffer('');
    setPopup(null);
    setAllMarked(false);
  }, [media.id, media.srt_content]);

  const seekToSentence = useCallback(
    (sentence: Sentence) => {
      if (sentence.startTime === undefined) return;
      seek(sentence.startTime);
      void audioRef.current?.play();
    },
    [audioRef, seek],
  );

  const handleWordClick = useCallback(
    (
      event: MouseEvent<HTMLElement>,
      word: string,
      sentence: string,
    ) => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();

      setPopup({
        word,
        sentence,
        x: rect.left,
        y: rect.bottom + 8,
      });
    },
    [],
  );

  const handlePopupSaved = useCallback(() => {
    void loadTrackedWords().catch((error) => {
      console.error('Failed to reload tracked words:', error);
    });
  }, [loadTrackedWords]);

  const handleMarkAllLearned = async () => {
    setMarkingAll(true);

    try {
      const words = extractWordsFromSentences(sentences);
      if (words.length > 0) await markWordsAsLearned(words);

      await loadTrackedWords();
      setAllMarked(true);
    } catch (error) {
      console.error('Failed to mark words as learned:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    if (!autoScroll || activeSentenceIndex < 0) return;

    const activeSentence = activeRef.current;
    if (!activeSentence) return;

    // Wait until React has attached the ref to the newly active sentence.
    const frameId = window.requestAnimationFrame(() => {
      const rect = activeSentence.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Keep the current sentence in a calm reading band. The page only moves
      // when the sentence leaves this area, instead of drifting continuously.
      const comfortTop = Math.max(96, viewportHeight * 0.24);
      const comfortBottom = viewportHeight * 0.62;
      const isComfortablyVisible =
        rect.top >= comfortTop && rect.bottom <= comfortBottom;

      if (isComfortablyVisible) return;

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      activeSentence.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeSentenceIndex, autoScroll]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
        return;
      }

      if (!/^\d$/.test(event.key)) return;
      event.preventDefault();

      setNumberBuffer((previousBuffer) => {
        const nextBuffer = previousBuffer + event.key;

        window.clearTimeout(numberTimeout.current);
        numberTimeout.current = window.setTimeout(() => {
          seek(Number.parseInt(nextBuffer, 10) * 60);
          setNumberBuffer('');
        }, 800);

        return nextBuffer;
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(numberTimeout.current);
    };
  }, [seek, togglePlay]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!focusMode && (
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {media.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{media.audio_filename}</p>
        </header>
      )}

      <audio
        ref={audioRef}
        src={media.audio_url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="hidden"
      />

      <div className={`sticky z-40 mb-[8px] ${focusMode ? 'top-[4px]' : 'top-[64px]'}`}>
        <CompactAudioControls
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          focusMode={focusMode}
          disabled={!media.audio_url}
          autoScroll={autoScroll}
          onTogglePlay={togglePlay}
          onSkip={skip}
          onSeek={seek}
          onToggleAutoScroll={() => setAutoScroll((value) => !value)}
        />
      </div>

      {numberBuffer && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-fade-in rounded-xl bg-slate-900 px-4 py-2 font-mono text-sm text-white shadow-lg">
          Jumping to {numberBuffer} min...
        </div>
      )}

      <div className="text-[15px] leading-loose">
        {sentences.map((sentence) => {
          const isActive = sentence.index === activeSentenceIndex;

          return (
            <span
              key={sentence.index}
              ref={isActive ? activeRef : undefined}
              onClick={() => seekToSentence(sentence)}
              aria-current={isActive ? 'true' : undefined}
              className={`cursor-pointer rounded px-1 py-0.5 transition-[background-color,color] duration-300 ${
                isActive
                  ? 'bg-emerald-100/80 text-slate-950'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sentence.text.split(/\s+/).map((word, wordIndex) => (
                <span
                  key={`${sentence.index}-${wordIndex}`}
                  onClick={(event) =>
                    handleWordClick(event, word, sentence.text)
                  }
                  className={`cursor-pointer rounded px-0.5 transition-colors hover:underline ${getWordClass(
                    word,
                    trackedWordMap,
                  )}`}
                >
                  {word}{' '}
                </span>
              ))}

              {sentence.endsWithPeriod ? <br /> : ' '}
            </span>
          );
        })}
      </div>

      <MarkAllLearnedButton
        allMarked={allMarked}
        markingAll={markingAll}
        onClick={handleMarkAllLearned}
      />

      <div className="h-20" />

      {popup && (
        <WordPopup
          word={popup.word}
          sentence={popup.sentence}
          x={popup.x}
          y={popup.y}
          onClose={() => setPopup(null)}
          onSaved={handlePopupSaved}
        />
      )}
    </div>
  );
}

/* ── Shared mark-all button ─────────────────────────────────── */

function MarkAllLearnedButton({
  allMarked,
  markingAll,
  onClick,
}: {
  allMarked: boolean;
  markingAll: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex justify-center">
      {allMarked ? (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          All words marked as learned!
        </div>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={markingAll}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Marking words...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              I know all the words here
            </>
          )}
        </button>
      )}
    </div>
  );
}