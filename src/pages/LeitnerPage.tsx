import { useCallback, useEffect, useState } from 'react';
import {
  fetchWordsByStatus,
  fetchTodayReviewWords,
  reviewWord,
  deleteWord,
  type LeitnerWord,
} from '@/lib/leitner';
import {
  Brain,
  Loader2,
  Trash2,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  X,
  ThumbsUp,
  ThumbsDown,
  Inbox,
  StickyNote,
} from 'lucide-react';

interface LeitnerPageProps {
  onNavigateToUpload: () => void;
}

type View = 'overview' | 'review';

export default function LeitnerPage({
  onNavigateToUpload: _onNavigateToUpload,
}: LeitnerPageProps) {
  const [view, setView] = useState<View>('overview');

  const [leitnerWords, setLeitnerWords] = useState<LeitnerWord[]>([]);
  const [unlearnedWords, setUnlearnedWords] = useState<LeitnerWord[]>([]);
  const [reviewWords, setReviewWords] = useState<LeitnerWord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leitner, unlearned, review] = await Promise.all([
        fetchWordsByStatus('leitner'),
        fetchWordsByStatus('unlearned'),
        fetchTodayReviewWords(),
      ]);

      setLeitnerWords(leitner);
      setUnlearnedWords(unlearned);
      setReviewWords(review);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load words.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const todayCount = reviewWords.length;

  const handleReview = async (remembered: boolean) => {
    const word = reviewWords[reviewIndex];

    if (!word) {
      return;
    }

    try {
      const updatedWord = await reviewWord(word.id, remembered);

      if (updatedWord) {
        setLeitnerWords((previousWords) => {
          // The word graduated and is now learned.
          // Remove it from the Leitner list without fetching learned words.
          if (updatedWord.status !== 'leitner') {
            return previousWords.filter(
              (currentWord) => currentWord.id !== updatedWord.id,
            );
          }

          return previousWords.map((currentWord) =>
            currentWord.id === updatedWord.id
              ? updatedWord
              : currentWord,
          );
        });
      }

      if (reviewIndex + 1 >= reviewWords.length) {
        setReviewDone(true);
        return;
      }

      setReviewIndex((previousIndex) => previousIndex + 1);
      setRevealed(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Review failed.',
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);

      setLeitnerWords((previousWords) =>
        previousWords.filter((word) => word.id !== id),
      );

      setUnlearnedWords((previousWords) =>
        previousWords.filter((word) => word.id !== id),
      );

      setReviewWords((previousWords) =>
        previousWords.filter((word) => word.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Delete failed.',
      );
    }
  };

  const startReview = () => {
    if (reviewWords.length === 0) {
      return;
    }

    setView('review');
    setReviewIndex(0);
    setRevealed(false);
    setReviewDone(false);
  };

  const exitReview = () => {
    setView('overview');
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (view === 'review') {
    return (
      <ReviewView
        words={reviewWords}
        index={reviewIndex}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onReview={handleReview}
        done={reviewDone}
        onExit={exitReview}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Leitner System
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Review words and track your progress.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Today's review card */}
      <div
        className={`mb-6 rounded-2xl border p-5 transition-all ${
          todayCount > 0
            ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                todayCount > 0
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Brain className="h-6 w-6" />
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                Today&apos;s Review
              </p>

              <p className="text-sm text-slate-500">
                {todayCount > 0
                  ? `${todayCount} word${todayCount === 1 ? '' : 's'} due`
                  : 'No words due today'}
              </p>
            </div>
          </div>

          {todayCount > 0 && (
            <button
              type="button"
              onClick={startReview}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-700"
            >
              Start Review
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Word lists */}
      <div className="space-y-6">
        <WordList
          title="In Leitner"
          icon={Brain}
          color="amber"
          words={leitnerWords}
          onDelete={handleDelete}
          onEmpty="No words in the Leitner system yet. Click words in the player to add them."
        />

        <WordList
          title="Unlearned"
          icon={Inbox}
          color="slate"
          words={unlearnedWords}
          onDelete={handleDelete}
          onEmpty="No skipped words."
        />
      </div>
    </div>
  );
}

interface ReviewViewProps {
  words: LeitnerWord[];
  index: number;
  revealed: boolean;
  onReveal: () => void;
  onReview: (remembered: boolean) => void;
  done: boolean;
  onExit: () => void;
}

function ReviewView({
  words,
  index,
  revealed,
  onReveal,
  onReview,
  done,
  onExit,
}: ReviewViewProps) {
  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          All caught up!
        </h2>

        <p className="mb-6 text-slate-500">
          You&apos;ve reviewed all due words for today.
        </p>

        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700"
        >
          Back to Leitner
        </button>
      </div>
    );
  }

  const word = words[index];

  if (!word) {
    return null;
  }

  const progress = ((index + 1) / words.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Progress bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit review"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-4 flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="font-mono text-xs text-slate-400">
          {index + 1}/{words.length}
        </span>
      </div>

      {/* Review card */}
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {!revealed ? (
          <>
            <p className="mb-4 text-sm text-slate-400">
              Do you remember this word?
            </p>

            <h2 className="mb-6 text-4xl font-bold capitalize text-slate-900">
              {word.word}
            </h2>

            <button
              type="button"
              onClick={onReveal}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-900"
            >
              <BookOpen className="h-4 w-4" />
              Reveal Context
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-4xl font-bold capitalize text-slate-900">
              {word.word}
            </h2>

            {word.sentence && (
              <p className="mb-2 max-w-lg text-base leading-relaxed text-slate-600">
                &ldquo;{word.sentence}&rdquo;
              </p>
            )}

            {word.note && (
              <div className="mb-4 flex max-w-lg items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-left">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="whitespace-pre-wrap text-sm leading-5 text-amber-950">
                  {word.note}
                </p>
              </div>
            )}

            <p className="mb-6 text-xs text-slate-400">
              Box {word.box} of 5
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onReview(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100"
              >
                <ThumbsDown className="h-4 w-4" />
                Forgot
              </button>

              <button
                type="button"
                onClick={() => onReview(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-100"
              >
                <ThumbsUp className="h-4 w-4" />
                Remembered
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface WordListProps {
  title: string;
  icon: typeof Brain;
  color: 'amber' | 'slate';
  words: LeitnerWord[];
  onDelete: (id: string) => void;
  onEmpty: string;
}

function WordList({
  title,
  icon: Icon,
  color,
  words,
  onDelete,
  onEmpty,
}: WordListProps) {
  const colorMap = {
    amber: {
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
    },
    slate: {
      text: 'text-slate-500',
      badge: 'bg-slate-100 text-slate-600',
    },
  }[color];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorMap.text}`} />

        <h3 className="font-semibold text-slate-800">
          {title}
        </h3>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap.badge}`}
        >
          {words.length}
        </span>
      </div>

      {words.length === 0 ? (
        <p className="pl-7 text-sm text-slate-400">
          {onEmpty}
        </p>
      ) : (
        <div className="space-y-2">
          {words.map((word) => (
            <div
              key={word.id}
              className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-slate-300"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium capitalize text-slate-800">
                  {word.word}
                </p>

                {word.sentence && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                    &ldquo;{word.sentence}&rdquo;
                  </p>
                )}

                {word.note && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                    <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="line-clamp-2 whitespace-pre-wrap">{word.note}</p>
                  </div>
                )}

                {word.status === 'leitner' && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${colorMap.badge}`}
                    >
                      Box {word.box}/5
                    </span>

                    <span className="text-xs text-slate-400">
                      Next:{' '}
                      {new Date(word.next_review).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDelete(word.id)}
                aria-label={`Delete ${word.word}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}