import { Brain, Inbox } from 'lucide-react';
import type { LeitnerWord } from '@/features/vocabulary/api/leitner';
import { LEITNER_COPY } from '@/features/leitner/config/pageConfig';
import LeitnerErrorAlert from '@/features/leitner/components/LeitnerErrorAlert';
import LeitnerHeader from '@/features/leitner/components/LeitnerHeader';
import LeitnerWordList from '@/features/leitner/components/LeitnerWordList';
import DueReviewCard from '@/features/leitner/components/DueReviewCard';

interface LeitnerOverviewProps {
  leitnerWords: LeitnerWord[];
  unlearnedWords: LeitnerWord[];
  todayCount: number;
  error: string | null;
  onStartReview: () => void;
  onDeleteWord: (id: string) => void;
}

export default function LeitnerOverview({
  leitnerWords,
  unlearnedWords,
  todayCount,
  error,
  onStartReview,
  onDeleteWord,
}: LeitnerOverviewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <LeitnerHeader />
      <LeitnerErrorAlert message={error} />

      <DueReviewCard
        count={todayCount}
        onStart={onStartReview}
      />

      <div className="space-y-6">
        <LeitnerWordList
          title={LEITNER_COPY.leitnerListTitle}
          icon={Brain}
          theme="amber"
          words={leitnerWords}
          emptyMessage={LEITNER_COPY.leitnerListEmpty}
          onDelete={onDeleteWord}
        />

        <LeitnerWordList
          title={LEITNER_COPY.unlearnedListTitle}
          icon={Inbox}
          theme="slate"
          words={unlearnedWords}
          emptyMessage={LEITNER_COPY.unlearnedListEmpty}
          onDelete={onDeleteWord}
        />
      </div>
    </div>
  );
}
