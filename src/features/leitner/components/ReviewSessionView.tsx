import type { LeitnerWord } from '@/features/vocabulary/api/leitner';
import LeitnerErrorAlert from '@/features/leitner/components/LeitnerErrorAlert';
import ReviewCard from '@/features/leitner/components/ReviewCard';
import ReviewCompleteState from '@/features/leitner/components/ReviewCompleteState';
import ReviewProgress from '@/features/leitner/components/ReviewProgress';

interface LeitnerReviewViewProps {
  words: LeitnerWord[];
  currentWord: LeitnerWord | null;
  index: number;
  progress: number;
  revealed: boolean;
  done: boolean;
  error: string | null;
  onReveal: () => void;
  onReview: (remembered: boolean) => void;
  onExit: () => void;
}

export default function ReviewSessionView({
  words,
  currentWord,
  index,
  progress,
  revealed,
  done,
  error,
  onReveal,
  onReview,
  onExit,
}: LeitnerReviewViewProps) {
  if (done) {
    return <ReviewCompleteState onExit={onExit} />;
  }

  if (!currentWord) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <LeitnerErrorAlert message={error} />

      <ReviewProgress
        index={index}
        total={words.length}
        progress={progress}
        onExit={onExit}
      />

      <ReviewCard
        word={currentWord}
        revealed={revealed}
        onReveal={onReveal}
        onReview={onReview}
      />
    </div>
  );
}
