import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import ePub from 'epubjs';

interface EpubRenditionApi {
  display: (location?: string) => Promise<unknown>;
  prev: () => Promise<unknown>;
  next: () => Promise<unknown>;
  themes: { fontSize: (size: string) => void };
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

interface EpubViewerProps {
  url: string;
  title: string;
  className: string;
}

export function EpubViewer({ url, title, className }: EpubViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<EpubRenditionApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let book: EpubBookApi | null = null;
    let rendition: EpubRenditionApi | null = null;

    container.innerHTML = '';
    setLoading(true);
    setError(null);
    setFontSize(100);

    const loadBook = async () => {
      try {
        book = ePub(url) as unknown as EpubBookApi;
        rendition = book.renderTo(container, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated',
        });

        await rendition.display();

        if (disposed) {
          rendition.destroy?.();
          book.destroy?.();
          return;
        }

        renditionRef.current = rendition;
        rendition.themes.fontSize('100%');
        setLoading(false);
      } catch (loadError) {
        if (disposed) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'The EPUB could not be opened.',
        );
        setLoading(false);
      }
    };

    void loadBook();

    return () => {
      disposed = true;
      rendition?.destroy?.();
      book?.destroy?.();
      renditionRef.current = null;
      container.innerHTML = '';
    };
  }, [url]);

  const navigate = (direction: 'previous' | 'next') => {
    const action =
      direction === 'previous'
        ? renditionRef.current?.prev()
        : renditionRef.current?.next();

    void action?.catch((navigationError) => {
      console.error(`Could not open the ${direction} EPUB page:`, navigationError);
    });
  };

  const changeFontSize = (difference: number) => {
    setFontSize((current) => {
      const next = Math.max(70, Math.min(180, current + difference));
      renditionRef.current?.themes.fontSize(`${next}%`);
      return next;
    });
  };

  const controlsDisabled = loading || Boolean(error);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 sm:px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('previous')}
            disabled={controlsDisabled}
            aria-label="Previous EPUB page"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('next')}
            disabled={controlsDisabled}
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
            onClick={() => changeFontSize(-10)}
            disabled={controlsDisabled}
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
            onClick={() => changeFontSize(10)}
            disabled={controlsDisabled}
            aria-label="Increase EPUB font size"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="h-full w-full bg-white" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
              <p className="mt-3 text-sm text-slate-500">Opening EPUB…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="max-w-sm px-6 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-700">
                EPUB could not be displayed
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
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
