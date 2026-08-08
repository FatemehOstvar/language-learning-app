import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  ScrollText,
} from 'lucide-react';
import type { MediaFile } from '@/shared/api/supabase';
import { TextLesson } from '@/features/player/components/TextLesson';
import { extractTextFromFile } from '@/shared/utils/textParser';
import {
  parseDocumentSliceFromUrl,
  stripDocumentSliceFromUrl,
} from '@/shared/utils/documentSlice';

interface DocumentStudyLessonProps {
  media: MediaFile;
  focusMode: boolean;
  controlsBottomClassName?: string;
}

const documentTextCache = new Map<string, string>();

function getDocumentUrl(media: MediaFile): string | null {
  if (media.document_url) {
    return media.document_url;
  }

  if (
    media.media_type === 'document' ||
    media.media_type === 'audio_document'
  ) {
    return media.content;
  }

  return null;
}

function getDocumentFilename(media: MediaFile): string {
  return (
    media.document_filename ??
    media.source_filename ??
    'lesson-document'
  );
}

function getDocumentMimeType(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.pdf')) {
    return 'application/pdf';
  }

  if (lower.endsWith('.epub')) {
    return 'application/epub+zip';
  }

  return 'application/octet-stream';
}

async function loadDocumentText(
  media: MediaFile,
  signal: AbortSignal,
): Promise<string> {
  const url = getDocumentUrl(media);

  if (!url) {
    throw new Error('This lesson does not contain a document URL.');
  }

  const cached = documentTextCache.get(url);
  if (cached !== undefined) {
    return cached;
  }

  const slice = parseDocumentSliceFromUrl(url);
  const sourceUrl = stripDocumentSliceFromUrl(url);
  const response = await fetch(sourceUrl, { signal });

  if (!response.ok) {
    throw new Error(
      `The document could not be downloaded (${response.status}).`,
    );
  }

  const filename = getDocumentFilename(media);
  const blob = await response.blob();
  const file = new File([blob], filename, {
    type: blob.type || getDocumentMimeType(filename),
  });

  const text = (await extractTextFromFile(file, slice))
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    throw new Error('No readable text was found in this document.');
  }

  documentTextCache.set(url, text);
  return text;
}

interface ContinuousScrollControlsProps {
  disabled: boolean;
  bottomClassName?: string;
}

function isEditableKeyboardTarget(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

function ContinuousScrollControls({
  disabled,
  bottomClassName = 'bottom-5',
}: ContinuousScrollControlsProps) {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(34);
  const [collapsed, setCollapsed] = useState(false);
  const runningRef = useRef(running);
  const speedRef = useRef(speed);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const remainderRef = useRef(0);

  const setRunningState = useCallback((nextRunning: boolean) => {
    runningRef.current = nextRunning;
    setRunning(nextRunning);

    if (!nextRunning) {
      previousTimeRef.current = null;
      remainderRef.current = 0;
    }
  }, []);

  const stop = useCallback(() => {
    setRunningState(false);
  }, [setRunningState]);

  const toggleRunning = useCallback(() => {
    if (disabled) {
      return;
    }

    setRunningState(!runningRef.current);
  }, [disabled, setRunningState]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (disabled) {
      stop();
    }
  }, [disabled, stop]);

  useEffect(() => {
    const handleKeyboardToggle = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableKeyboardTarget(event.target)
      ) {
        return;
      }

      // Do not trigger scroll shortcuts while a popup is open.
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'f') {
        event.preventDefault();
        toggleRunning();
        return;
      }

      if (key === '-' || key === '_') {
        event.preventDefault();
        setCollapsed(true);
        return;
      }

      if (key === '+' || key === '=') {
        event.preventDefault();
        setCollapsed(false);
      }
    };

    window.addEventListener('keydown', handleKeyboardToggle);

    return () => {
      window.removeEventListener('keydown', handleKeyboardToggle);
    };
  }, [toggleRunning]);

  useEffect(() => {
    const tick = (time: number) => {
      if (runningRef.current) {
        const previous = previousTimeRef.current;
        previousTimeRef.current = time;

        if (previous !== null) {
          const elapsedSeconds = Math.min(
            (time - previous) / 1000,
            0.05,
          );

          remainderRef.current +=
            speedRef.current * elapsedSeconds;

          const wholePixels = Math.trunc(remainderRef.current);

          if (wholePixels > 0) {
            const before = window.scrollY;
            window.scrollBy(0, wholePixels);
            remainderRef.current -= wholePixels;

            const atBottom =
              window.innerHeight + window.scrollY >=
              document.documentElement.scrollHeight - 2;

            if (atBottom || window.scrollY === before) {
              stop();
            }
          }
        }
      } else {
        previousTimeRef.current = null;
        remainderRef.current = 0;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [stop]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const stopForManualMovement = () => stop();

    window.addEventListener('wheel', stopForManualMovement, {
      passive: true,
    });
    window.addEventListener('touchstart', stopForManualMovement, {
      passive: true,
    });

    return () => {
      window.removeEventListener('wheel', stopForManualMovement);
      window.removeEventListener('touchstart', stopForManualMovement);
    };
  }, [running, stop]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Show continuous scroll controls"
        title="Show continuous scroll controls (+)"
        className={`fixed ${bottomClassName} right-3 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 opacity-45 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white hover:text-emerald-700 hover:opacity-100 focus-visible:opacity-100`}
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className={`fixed ${bottomClassName} right-5 z-40 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={toggleRunning}
          aria-label={running ? 'Pause scrolling' : 'Start scrolling'}
          title={
            running
              ? 'Pause continuous scrolling (F)'
              : 'Start continuous scrolling (F)'
          }
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <ScrollText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Continuous scroll</span>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                F
              </kbd>
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5">
              <span>{speed} px/s</span>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Hide continuous scroll controls"
                title="Hide controls (-)"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="sr-only">Hide controls</span>
                <Minus className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>

          <input
            type="range"
            min="6"
            max="48"
            step="1"
            value={speed}
            disabled={disabled}
            onChange={(event) => setSpeed(Number(event.target.value))}
            aria-label="Scrolling speed"
            className="w-full accent-emerald-600 disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}

export function DocumentStudyLesson({
  media,
  focusMode,
  controlsBottomClassName = 'bottom-5',
}: DocumentStudyLessonProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setText('');

    void loadDocumentText(media, controller.signal)
      .then((loadedText) => {
        if (!controller.signal.aborted) {
          setText(loadedText);
        }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'The document text could not be loaded.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    media.id,
    media.content,
    media.document_url,
    media.document_filename,
    media.source_filename,
  ]);

  const textMedia = useMemo<MediaFile>(
    () => ({
      ...media,
      media_type: 'text',
      content: text,
      source_filename: getDocumentFilename(media),
    }),
    [media, text],
  );

  if (loading) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center">
        <div className="text-center text-slate-500">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm">Preparing interactive study text…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-semibold text-slate-800">
          The interactive study view could not be prepared.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <TextLesson media={textMedia} focusMode={focusMode} />
      <ContinuousScrollControls
        disabled={!text}
        bottomClassName={controlsBottomClassName}
      />
    </>
  );
}
