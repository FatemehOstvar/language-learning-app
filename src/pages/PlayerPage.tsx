import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { MediaFile } from '@/lib/supabase';
import { parseSrt, type SrtCue } from '@/lib/srtParser';
import { formatTime } from '@/lib/formatTime';
import { Play, Pause, SkipBack, SkipForward, ScrollText, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import WordPopup from '@/components/WordPopup';
import { fetchWordMap, normalizeWord, markWordsAsLearned, type WordStatus, type LeitnerWord } from '@/lib/leitner';

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-slate-400">No media loaded. Upload a file or pick one from the library.</p>
      </div>
    );
  }

  if (media.media_type === 'text') {
    return <TextReader media={media} />;
  }
  return <AudioPlayer media={media} />;
}

/* ── Shared word coloring logic ─────────────────────────────── */

function getWordClass(
  word: string,
  wordMap: Map<string, LeitnerWord>,
): string {
  const clean = normalizeWord(word);
  const entry = wordMap.get(clean);
  if (!entry) return 'bg-blue-100 text-gray-950';
  if (entry.status === 'learned') return 'text-gray-950';
  if (entry.status === 'leitner') return 'bg-amber-200 text-gray-950 font-medium';
  return 'bg-blue-100 text-gray-950';
}

/* ── Text-only reader ─────────────────────────────────────────── */

function TextReader({ media }: { media: MediaFile }) {
  const [copiedSentence, setCopiedSentence] = useState<number | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [wordMap, setWordMap] = useState<Map<string, LeitnerWord>>(new Map());
  const [markingAll, setMarkingAll] = useState(false);
  const [allMarked, setAllMarked] = useState(false);

  useEffect(() => {
    fetchWordMap().then(setWordMap).catch(() => {});
  }, []);

  const sentences = useMemo<Sentence[]>(() => {
    if (!media.content) return [];
    return media.content.split('\n').map((text, index) => ({
      index,
      text: text.trim(),
      endsWithPeriod: /[.!?]$/.test(text.trim()),
    })).filter((s) => s.text.length > 0);
  }, [media.content]);

  const handleSentenceClick = useCallback((sentence: Sentence) => {
    navigator.clipboard.writeText(sentence.text);
    setCopiedSentence(sentence.index);
    setTimeout(() => setCopiedSentence(null), 1500);
  }, []);

  const handleWordClick = useCallback((e: React.MouseEvent, word: string, sentence: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopup({ word, sentence, x: rect.left, y: rect.bottom + 8 });
  }, []);

  const handlePopupSaved = useCallback((_word: string, _status: WordStatus) => {
    fetchWordMap().then(setWordMap).catch(() => {});
  }, []);

  const handleMarkAllLearned = async () => {
    setMarkingAll(true);
    try {
      const wordList = sentences.map((s) => ({ word: s.text }));
      await markWordsAsLearned(wordList);
      await fetchWordMap().then(setWordMap);
      setAllMarked(true);
    } catch {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{media.title}</h1>
          {media.source_filename && (
            <p className="text-sm text-slate-400 mt-1">{media.source_filename}</p>
          )}
        </div>
      </div>

      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-3 mb-6 flex items-center gap-2 text-sm text-slate-500">
        <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="hidden sm:inline">Click a sentence to copy it. Click a word to add it to Leitner.</span>
        <span className="sm:hidden">Tap sentence to copy. Tap word for Leitner.</span>
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
              {words.map((word, wi) => (
                <span
                  key={wi}
                  onClick={(e) => handleWordClick(e, word, sentence.text)}
                  className={`cursor-pointer rounded px-0.5 transition-colors hover:underline ${getWordClass(word, wordMap)}`}
                >
                  {word}{' '}
                </span>
              ))}
              {sentence.endsWithPeriod ? <br /> : ' '}
            </span>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        {allMarked ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            All words marked as learned!
          </div>
        ) : (
          <button
            onClick={handleMarkAllLearned}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {markingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Marking words...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                I know all the words here
              </>
            )}
          </button>
        )}
      </div>

      <div className="h-20" />
TODO : pop up differrently for learned words or leitner words popup.word?
      {popup &&  (
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

/* ── Audio player ─────────────────────────────────────────────── */

function AudioPlayer({ media }: { media: MediaFile }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [numberBuffer, setNumberBuffer] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [wordMap, setWordMap] = useState<Map<string, LeitnerWord>>(new Map());
  const [markingAll, setMarkingAll] = useState(false);
  const [allMarked, setAllMarked] = useState(false);
  const numberTimeout = useRef<number | undefined>(undefined);
  const activeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (media) {
      setCues(parseSrt(media.srt_content || ''));
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [media]);

  useEffect(() => {
    fetchWordMap().then(setWordMap).catch(() => {});
  }, []);

  const sentences = useMemo<Sentence[]>(() => {
    const result: Sentence[] = [];
    let current: SrtCue[] = [];
    for (const cue of cues) {
      current.push(cue);
      const combined = current.map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim();
      if (combined.endsWith('.')) {
        result.push({
          index: result.length,
          cues: current,
          text: combined,
          startTime: current[0].startTime,
          endTime: current[current.length - 1].endTime,
          endsWithPeriod: true,
        });
        current = [];
      }
    }
    if (current.length > 0) {
      const combined = current.map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim();
      result.push({
        index: result.length,
        cues: current,
        text: combined,
        startTime: current[0].startTime,
        endTime: current[current.length - 1].endTime,
        endsWithPeriod: combined.endsWith('.'),
      });
    }
    return result;
  }, [cues]);

  const activeSentenceIndex = useMemo(() => {
    return sentences.findIndex((s) => currentTime >= (s.startTime || 0) && currentTime <= (s.endTime || 0));
  }, [sentences, currentTime]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }, []);

  useEffect(() => {
    if (!autoScroll) return;

    const HOLD_TOP = 140;
    const COMFORT_BOTTOM = Math.max(260, window.innerHeight * 0.5);
    const DRIFT = 0.3;
    const MIN_DRIFT = 0.15;
    const CATCHUP = 1.4;
    let smoothed = 0;

    const tick = () => {
      const el = activeRef.current;
      let target = DRIFT;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < HOLD_TOP) {
          target = MIN_DRIFT;
        } else if (rect.bottom > COMFORT_BOTTOM) {
          target = CATCHUP;
        }
      }
      smoothed += (target - smoothed) * 0.08;
      if (smoothed > 0.02) window.scrollBy({ top: smoothed });
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setNumberBuffer((prev) => {
          const next = prev + e.key;
          window.clearTimeout(numberTimeout.current);
          numberTimeout.current = window.setTimeout(() => {
            const minutes = parseInt(next, 10);
            const audio = audioRef.current;
            if (audio && !isNaN(minutes)) {
              audio.currentTime = Math.min(minutes * 60, duration || audio.duration);
            }
            setNumberBuffer('');
          }, 800);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.clearTimeout(numberTimeout.current);
    };
  });

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, []);

  const seekToSentence = useCallback((sentence: Sentence) => {
    const audio = audioRef.current;
    if (!audio || sentence.startTime === undefined) return;
    audio.currentTime = sentence.startTime;
    audio.play();
  }, []);

  const skipRelative = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  }, [duration]);

  const handleWordClick = useCallback((e: React.MouseEvent, word: string, sentence: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopup({ word, sentence, x: rect.left, y: rect.bottom + 8 });
  }, []);

  const handlePopupSaved = useCallback((_word: string, _status: WordStatus) => {
    fetchWordMap().then(setWordMap).catch(() => {});
  }, []);

  const handleMarkAllLearned = async () => {
    setMarkingAll(true);
    try {
      const wordList = sentences.map((s) => ({ word: s.text, sentence: s.text }));
      await markWordsAsLearned(wordList);
      await fetchWordMap().then(setWordMap);
      setAllMarked(true);
    } catch {
      setMarkingAll(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{media.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{media.audio_filename}</p>
      </div>

      <audio
        ref={audioRef}
        src={media.audio_url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-4 mb-6
                      max-md:fixed max-md:left-0 max-md:top-16 max-md:bottom-0 max-md:mb-0 max-md:rounded-none max-md:rounded-r-2xl max-md:border-l-0 max-md:border-t-0 max-md:border-b-0 max-md:shadow-lg max-md:flex max-md:flex-col max-md:items-center max-md:gap-3 max-md:py-4 max-md:px-2 max-md:w-16">
        <div className="mb-3 max-md:mb-0 max-md:order-last max-md:h-full max-md:w-1.5 max-md:flex max-md:flex-col-reverse">
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden max-md:h-full max-md:w-1.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-150 max-md:w-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-mono max-md:hidden">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 max-md:flex-col max-md:gap-2">
          <button
            onClick={() => skipRelative(-10)}
            className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors max-md:p-1.5"
            title="Back 10s"
          >
            <SkipBack className="w-5 h-5 max-md:w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-all hover:scale-105 max-md:w-11 max-md:h-11"
          >
            {isPlaying ? <Pause className="w-6 h-6 max-md:w-5 h-5" /> : <Play className="w-6 h-6 ml-0.5 max-md:w-5 max-md:h-5 max-md:ml-0.5" />}
          </button>
          <button
            onClick={() => skipRelative(10)}
            className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors max-md:p-1.5"
            title="Forward 10s"
          >
            <SkipForward className="w-5 h-5 max-md:w-4 h-4" />
          </button>

          <div className="ml-4 flex items-center gap-2 border-l border-slate-200 pl-4 max-md:ml-0 max-md:flex-col max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-2">
            <ScrollText className={`w-4 h-4 ${autoScroll ? 'text-emerald-500' : 'text-slate-300'}`} />
            <button
              onClick={() => setAutoScroll((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${autoScroll ? 'bg-emerald-500' : 'bg-slate-300'} max-md:rotate-90`}
              title="Toggle auto-scroll"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoScroll ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {numberBuffer && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-mono shadow-lg animate-fade-in">
          Jumping to {numberBuffer} min...
        </div>
      )}

      <div className="text-[15px] leading-loose max-md:ml-16 max-md:px-2">
        {sentences.map((sentence) => {
          const isActive = sentence.index === activeSentenceIndex;
          const words = sentence.text.split(/\s+/);
          return (
            <span
              key={sentence.index}
              ref={isActive ? activeRef as React.RefObject<HTMLSpanElement> : null}
              onClick={() => seekToSentence(sentence)}
              className={`cursor-pointer rounded px-1 py-0.5 transition-colors duration-300 ${
                isActive && sentence.endsWithPeriod
                  ? 'bg-emerald-100'
                  : 'hover:bg-slate-100'
              }`}
            >
              {words.map((word, wi) => (
                <span
                  key={wi}
                  onClick={(e) => handleWordClick(e, word, sentence.text)}
                  className={`cursor-pointer rounded px-0.5 transition-colors hover:underline ${getWordClass(word, wordMap)}`}
                >
                  {word}{' '}
                </span>
              ))}
              {sentence.endsWithPeriod ? <br /> : ' '}
            </span>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        {allMarked ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            All words marked as learned!
          </div>
        ) : (
          <button
            onClick={handleMarkAllLearned}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {markingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Marking words...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                I know all the words here
              </>
            )}
          </button>
        )}
      </div>

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
