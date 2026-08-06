import type { LucideIcon } from 'lucide-react';
import { StickyNote, Trash2 } from 'lucide-react';
import type { LeitnerWord } from '@/features/vocabulary/api/leitner';
import {
  formatReviewDate,
  WORD_LIST_THEMES,
  type WordListTheme,
} from '@/features/leitner/config/pageConfig';

interface LeitnerWordListProps {
  title: string;
  icon: LucideIcon;
  theme: WordListTheme;
  words: LeitnerWord[];
  emptyMessage: string;
  onDelete: (id: string) => void;
}

export default function LeitnerWordList({
  title,
  icon: Icon,
  theme,
  words,
  emptyMessage,
  onDelete,
}: LeitnerWordListProps) {
  const styles = WORD_LIST_THEMES[theme];

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${styles.icon}`} />

        <h2 className="font-semibold text-slate-800">
          {title}
        </h2>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}
        >
          {words.length}
        </span>
      </div>

      {words.length === 0 ? (
        <p className="pl-7 text-sm text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {words.map((word) => (
            <WordListItem
              key={word.id}
              word={word}
              badgeClassName={styles.badge}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface WordListItemProps {
  word: LeitnerWord;
  badgeClassName: string;
  onDelete: (id: string) => void;
}

function WordListItem({
  word,
  badgeClassName,
  onDelete,
}: WordListItemProps) {
  return (
    <article className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-slate-300">
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
            <p className="line-clamp-2 whitespace-pre-wrap">
              {word.note}
            </p>
          </div>
        )}

        {word.status === 'leitner' && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${badgeClassName}`}
            >
              Box {word.box}/5
            </span>

            <span className="text-xs text-slate-400">
              Next: {formatReviewDate(word.next_review)}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(word.id)}
        aria-label={`Delete ${word.word}`}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}
