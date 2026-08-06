import LessonTypeSelector from '@/features/upload/components/LessonTypeSelector';
import LessonUploadForm from '@/features/upload/components/LessonUploadForm';
import UploadHeader from '@/features/upload/components/UploadHeader';
import { useUploadForm } from '@/features/upload/hooks/useUploadForm';
import type { UploadPageProps } from '@/features/upload/model/types';

export default function UploadPage({
  onUploaded,
  onGoToPlayer,
}: UploadPageProps) {
  const form = useUploadForm({ onUploaded });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <UploadHeader />

      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <LessonTypeSelector
          activeTab={form.tab}
          onChange={form.handleTabChange}
        />

        <LessonUploadForm form={form} onGoToPlayer={onGoToPlayer} />
      </div>
    </div>
  );
}
