import LeitnerLoadingState from '@/features/leitner/components/LeitnerLoadingState';
import LeitnerOverview from '@/features/leitner/components/LeitnerOverview';
import ReviewSessionView from '@/features/leitner/components/ReviewSessionView';
import { useLeitnerPage } from '@/features/leitner/hooks/useLeitnerPage';

interface LeitnerPageProps {
  onNavigateToUpload: () => void;
}

export default function LeitnerPage(
  _props: LeitnerPageProps,
) {
  const page = useLeitnerPage();

  if (page.loading) {
    return <LeitnerLoadingState />;
  }

  if (page.view === 'review') {
    return (
      <ReviewSessionView
        words={page.reviewWords}
        currentWord={page.currentReviewWord}
        index={page.reviewIndex}
        progress={page.reviewProgress}
        revealed={page.revealed}
        done={page.reviewDone}
        error={page.error}
        onReveal={page.revealCurrentWord}
        onReview={page.submitReview}
        onExit={page.exitReview}
      />
    );
  }

  return (
    <LeitnerOverview
      leitnerWords={page.leitnerWords}
      unlearnedWords={page.unlearnedWords}
      todayCount={page.todayCount}
      error={page.error}
      onStartReview={page.startReview}
      onDeleteWord={page.removeWord}
    />
  );
}
