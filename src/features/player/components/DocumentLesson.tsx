import type { MediaFile } from '@/shared/api/supabase';
import { DocumentLessonHeader } from '@/features/player/components/DocumentLessonHeader';
import { DocumentStudyLesson } from '@/features/player/components/DocumentStudyLesson';

interface DocumentLessonProps {
  media: MediaFile;
  focusMode: boolean;
}

export function DocumentLesson({
  media,
  focusMode,
}: DocumentLessonProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {!focusMode && (
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          <DocumentLessonHeader
            media={media}
            description="Study the document as interactive text."
          />
        </div>
      )}

      <DocumentStudyLesson
        media={media}
        focusMode
      />
    </div>
  );
}
