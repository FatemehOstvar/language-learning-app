import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
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
} from 'lucide-react';
import WordPopup from '@/components/WordPopup';
import {
  fetchWordsByStatus,
  normalizeWord,
  markWordsAsLearned,
  type WordStatus,
  type LeitnerWord,
} from '@/lib/leitner';

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

export default function PlayerPage({ media }: PlayerPageProps) {
  if (!media) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-slate-400">
          No media loaded. Upload a file or pick one from the library.
        </p>
      </div>
    );
  }

  if (media.media_type === 'text') {
    return <TextReader media={media} />;
  }

  return <AudioPlayer media={media} />;
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

/* ── Text reader ────────────────────────────────────────────── */

function TextReader({ media }: { media: MediaFile }) {
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

      <div className="sticky top-16 z-30 mb-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-500 shadow-sm backdrop-blur-md">
        <BookOpen className="h-4 w-4 shrink-0 text-amber-500" />

        <span className="hidden sm:inline">
          Click a sentence to copy it. Click a word to change its
          status.
        </span>

        <span className="sm:hidden">
          Tap a sentence to copy. Tap a word to change its status.
        </span>
      </div>

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

/* ── Audio player ───────────────────────────────────────────── */

function AudioPlayer({ media }: { media: MediaFile }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const numberTimeout = useRef<number | undefined>(undefined);

  const [cues, setCues] = useState<SrtCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [numberBuffer, setNumberBuffer] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [allMarked, setAllMarked] = useState(false);

  const { trackedWordMap, loadTrackedWords } = useTrackedWords();

  useEffect(() => {
    setCues(parseSrt(media.srt_content || ''));
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setNumberBuffer('');
    setPopup(null);
    setAllMarked(false);
  }, [media]);

  const sentences = useMemo<Sentence[]>(() => {
    const result: Sentence[] = [];
    let currentCues: SrtCue[] = [];

    for (const cue of cues) {
      currentCues.push(cue);

      const combinedText = currentCues
        .map((currentCue) => currentCue.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (/[.!?]$/.test(combinedText)) {
        result.push({
          index: result.length,
          cues: currentCues,
          text: combinedText,
          startTime: currentCues[0].startTime,
          endTime: currentCues[currentCues.length - 1].endTime,
          endsWithPeriod: true,
        });

        currentCues = [];
      }
    }

    if (currentCues.length > 0) {
      const combinedText = currentCues
        .map((currentCue) => currentCue.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      result.push({
        index: result.length,
        cues: currentCues,
        text: combinedText,
        startTime: currentCues[0].startTime,
        endTime: currentCues[currentCues.length - 1].endTime,
        endsWithPeriod: /[.!?]$/.test(combinedText),
      });
    }

    return result;
  }, [cues]);

  const activeSentenceIndex = useMemo(() => {
    return sentences.findIndex((sentence) => {
      const startTime = sentence.startTime ?? 0;
      const endTime = sentence.endTime ?? 0;

      return (
        currentTime >= startTime &&
        currentTime <= endTime
      );
    });
  }, [sentences, currentTime]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(audio.currentTime);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const seekToSentence = useCallback(
    (sentence: Sentence) => {
      const audio = audioRef.current;

      if (
        !audio ||
        sentence.startTime === undefined
      ) {
        return;
      }

      audio.currentTime = sentence.startTime;
      void audio.play();
    },
    [],
  );

  const skipRelative = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      const maximumDuration =
        duration || audio.duration || 0;

      audio.currentTime = Math.max(
        0,
        Math.min(
          maximumDuration,
          audio.currentTime + seconds,
        ),
      );
    },
    [duration],
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

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    const holdTop = 140;
    const comfortBottom = Math.max(
      260,
      window.innerHeight * 0.5,
    );
    const normalDrift = 0.3;
    const minimumDrift = 0.15;
    const catchUpSpeed = 1.4;

    let smoothedSpeed = 0;

    const tick = () => {
      const activeElement = activeRef.current;
      let targetSpeed = normalDrift;

      if (activeElement) {
        const rect =
          activeElement.getBoundingClientRect();

        if (rect.top < holdTop) {
          targetSpeed = minimumDrift;
        } else if (rect.bottom > comfortBottom) {
          targetSpeed = catchUpSpeed;
        }
      }

      smoothedSpeed +=
        (targetSpeed - smoothedSpeed) * 0.08;

      if (smoothedSpeed > 0.02) {
        window.scrollBy({
          top: smoothedSpeed,
        });
      }

      rafRef.current =
        window.requestAnimationFrame(tick);
    };

    rafRef.current =
      window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== undefined) {
        window.cancelAnimationFrame(
          rafRef.current,
        );
      }
    };
  }, [autoScroll]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
        return;
      }

      if (
        event.key < '0' ||
        event.key > '9'
      ) {
        return;
      }

      event.preventDefault();

      setNumberBuffer((previousBuffer) => {
        const nextBuffer =
          previousBuffer + event.key;

        window.clearTimeout(
          numberTimeout.current,
        );

        numberTimeout.current =
          window.setTimeout(() => {
            const minutes = Number.parseInt(
              nextBuffer,
              10,
            );
            const audio = audioRef.current;

            if (
              audio &&
              Number.isFinite(minutes)
            ) {
              const maximumDuration =
                duration ||
                audio.duration ||
                0;

              audio.currentTime = Math.min(
                minutes * 60,
                maximumDuration,
              );
            }

            setNumberBuffer('');
          }, 800);

        return nextBuffer;
      });
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      window.clearTimeout(
        numberTimeout.current,
      );
    };
  }, [duration, togglePlay]);

  const progress =
    duration > 0
      ? (currentTime / duration) * 100
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {media.title}
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          {media.audio_filename}
        </p>
      </div>

      <audio
        ref={audioRef}
        src={media.audio_url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration)
        }
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <div
        className="
          sticky top-16 z-40 mb-6 rounded-2xl border border-slate-200
          bg-white/90 p-4 shadow-sm backdrop-blur-md
          max-md:fixed max-md:bottom-0 max-md:left-0 max-md:top-16
          max-md:mb-0 max-md:flex max-md:w-16 max-md:flex-col
          max-md:items-center max-md:gap-3 max-md:rounded-none
          max-md:rounded-r-2xl max-md:border-b-0 max-md:border-l-0
          max-md:border-t-0 max-md:px-2 max-md:py-4 max-md:shadow-lg
        "
      >
        <div className="mb-3 max-md:order-last max-md:mb-0 max-md:flex max-md:h-full max-md:w-1.5 max-md:flex-col-reverse">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 max-md:h-full max-md:w-1.5">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-150 max-md:w-full"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-400 max-md:hidden">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 max-md:flex-col max-md:gap-2">
          <button
            type="button"
            onClick={() => skipRelative(-10)}
            aria-label="Go back 10 seconds"
            title="Back 10 seconds"
            className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-slate-100 max-md:p-1.5"
          >
            <SkipBack className="h-5 w-5 max-md:h-4 max-md:w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={
              isPlaying
                ? 'Pause audio'
                : 'Play audio'
            }
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-all hover:scale-105 hover:bg-emerald-700 max-md:h-11 max-md:w-11"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 max-md:h-5 max-md:w-5" />
            ) : (
              <Play className="ml-0.5 h-6 w-6 max-md:h-5 max-md:w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipRelative(10)}
            aria-label="Go forward 10 seconds"
            title="Forward 10 seconds"
            className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-slate-100 max-md:p-1.5"
          >
            <SkipForward className="h-5 w-5 max-md:h-4 max-md:w-4" />
          </button>

          <div className="ml-4 flex items-center gap-2 border-l border-slate-200 pl-4 max-md:ml-0 max-md:flex-col max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-2">
            <ScrollText
              className={`h-4 w-4 ${
                autoScroll
                  ? 'text-emerald-500'
                  : 'text-slate-300'
              }`}
            />

            <button
              type="button"
              onClick={() =>
                setAutoScroll((value) => !value)
              }
              aria-label="Toggle automatic scrolling"
              aria-pressed={autoScroll}
              title="Toggle auto-scroll"
              className={`relative h-5 w-10 rounded-full transition-colors duration-200 max-md:rotate-90 ${
                autoScroll
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  autoScroll
                    ? 'translate-x-5'
                    : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {numberBuffer && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-fade-in rounded-xl bg-slate-900 px-4 py-2 font-mono text-sm text-white shadow-lg">
          Jumping to {numberBuffer} min...
        </div>
      )}

      <div className="text-[15px] leading-loose max-md:ml-16 max-md:px-2">
        {sentences.map((sentence) => {
          const isActive =
            sentence.index ===
            activeSentenceIndex;

          const words =
            sentence.text.split(/\s+/);

          return (
            <span
              key={sentence.index}
              ref={
                isActive
                  ? activeRef
                  : undefined
              }
              onClick={() =>
                seekToSentence(sentence)
              }
              className={`cursor-pointer rounded px-1 py-0.5 transition-colors duration-300 ${
                isActive &&
                sentence.endsWithPeriod
                  ? 'bg-emerald-100'
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

              {sentence.endsWithPeriod ? (
                <br />
              ) : (
                ' '
              )}
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