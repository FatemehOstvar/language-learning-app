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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-9">
        <UploadHeader />

        <div className="mt-6 space-y-3">
          <LessonTypeSelector
            activeTab={form.tab}
            onChange={form.handleTabChange}
          />

          <LessonUploadForm
            form={form}
            onGoToPlayer={onGoToPlayer}
          />
        </div>
      </div>
    </div>
  );
}
