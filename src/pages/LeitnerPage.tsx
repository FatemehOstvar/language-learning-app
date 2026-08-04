import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllWords, fetchTodayReviewWords, reviewWord, deleteWord,
  type LeitnerWord, type WordStatus,
} from '@/lib/leitner';
import {
  Brain, Loader2, Trash2, BookOpen, CheckCircle2, RotateCcw,
  ChevronRight, X, Check, ThumbsUp, ThumbsDown, Inbox,
} from 'lucide-react';

interface LeitnerPageProps {
  onNavigateToUpload: () => void;
}

type View = 'overview' | 'review';

export default function LeitnerPage({ onNavigateToUpload }: LeitnerPageProps) {
  const [view, setView] = useState<View>('overview');
  const [words, setWords] = useState<LeitnerWord[]>([]);
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
      const [all, review] = await Promise.all([fetchAllWords(), fetchTodayReviewWords()]);
      setWords(all);
      setReviewWords(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load words.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leitnerWords = words.filter((w) => w.status === 'leitner');
  const learnedWords = words.filter((w) => w.status === 'learned');
  const unlearnedWords = words.filter((w) => w.status === 'unlearned');
  const todayCount = reviewWords.length;

  const handleReview = async (remembered: boolean) => {
    const word = reviewWords[reviewIndex];
    if (!word) return;
    try {
      await reviewWord(word.id, remembered);
      if (reviewIndex + 1 >= reviewWords.length) {
        setReviewDone(true);
      } else {
        setReviewIndex(reviewIndex + 1);
        setRevealed(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const startReview = () => {
    if (reviewWords.length === 0) return;
    setView('review');
    setReviewIndex(0);
    setRevealed(false);
    setReviewDone(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
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
        onExit={() => { setView('overview'); load(); }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leitner System</h1>
        <p className="text-sm text-slate-400 mt-1">Review words and track your progress.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Today's review card */}
      <div className={`rounded-2xl border p-5 mb-6 transition-all ${
        todayCount > 0
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              todayCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Today's Review</p>
              <p className="text-sm text-slate-500">
                {todayCount > 0 ? `${todayCount} word${todayCount > 1 ? 's' : ''} due` : 'No words due today'}
              </p>
            </div>
          </div>
          {todayCount > 0 && (
            <button
              onClick={startReview}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium shadow-sm hover:bg-amber-700 transition-all"
            >
              Start Review
              <ChevronRight className="w-4 h-4" />
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
          title="Learned"
          icon={CheckCircle2}
          color="emerald"
          words={learnedWords}
          onDelete={handleDelete}
          onEmpty="No learned words yet. Words graduate here after mastering all 5 boxes."
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

function ReviewView({
  words, index, revealed, onReveal, onReview, done, onExit,
}: {
  words: LeitnerWord[];
  index: number;
  revealed: boolean;
  onReveal: () => void;
  onReview: (remembered: boolean) => void;
  done: boolean;
  onExit: () => void;
}) {
  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">All caught up!</h2>
        <p className="text-slate-500 mb-6">You've reviewed all due words for today.</p>
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-sm hover:bg-emerald-700 transition-all"
        >
          Back to Leitner
        </button>
      </div>
    );
  }

  const word = words[index];
  if (!word) return null;
  const progress = ((index) / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 mx-4">
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-slate-400 font-mono">{index + 1}/{words.length}</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
        {!revealed ? (
          <>
            <p className="text-sm text-slate-400 mb-4">Do you remember this word?</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-6 capitalize">{word.word}</h2>
            <button
              onClick={onReveal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Reveal Context
            </button>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-bold text-slate-900 mb-4 capitalize">{word.word}</h2>
            {word.sentence && (
              <p className="text-slate-600 text-base leading-relaxed mb-2 max-w-lg">
                "{word.sentence}"
              </p>
            )}
            <p className="text-xs text-slate-400 mb-6">Box {word.box} of 5</p>
            <div className="flex gap-3">
              <button
                onClick={() => onReview(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-200 hover:bg-red-100 transition-all"
              >
                <ThumbsDown className="w-4 h-4" />
                Forgot
              </button>
              <button
                onClick={() => onReview(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-200 hover:bg-emerald-100 transition-all"
              >
                <ThumbsUp className="w-4 h-4" />
                Remembered
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WordList({
  title, icon: Icon, color, words, onDelete, onEmpty,
}: {
  title: string;
  icon: typeof Brain;
  color: 'amber' | 'emerald' | 'slate';
  words: LeitnerWord[];
  onDelete: (id: string) => void;
  onEmpty: string;
}) {
  const colorMap = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-500', badge: 'bg-slate-100 text-slate-600' },
  }[color];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${colorMap.text}`} />
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorMap.badge}`}>
          {words.length}
        </span>
      </div>

      {words.length === 0 ? (
        <p className="text-sm text-slate-400 pl-7">{onEmpty}</p>
      ) : (
        <div className="space-y-2">
          {words.map((w) => (
            <div
              key={w.id}
              className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition-all"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 capitalize">{w.word}</p>
                {w.sentence && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">"{w.sentence}"</p>
                )}
                {w.status === 'leitner' && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${colorMap.badge}`}>
                      Box {w.box}/5
                    </span>
                    <span className="text-xs text-slate-400">
                      Next: {new Date(w.next_review).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onDelete(w.id)}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
