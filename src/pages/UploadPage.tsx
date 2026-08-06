import LessonTypeSidebar from '@/components/LessonTypeSidebar';
import UploadLessonForm from '@/components/UploadLessonForm';
import UploadPageHeader from '@/components/UploadPageHeader';
import { useUploadForm } from '@/lib/useUploadForm';
import type { UploadPageProps } from '@/lib/uploadTypes';

export default function UploadPage({
  onUploaded,
  onGoToPlayer,
}: UploadPageProps) {
  const form = useUploadForm({ onUploaded });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <UploadPageHeader />

      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <LessonTypeSidebar
          activeTab={form.tab}
          onChange={form.handleTabChange}
        />

        <UploadLessonForm form={form} onGoToPlayer={onGoToPlayer} />
      </div>
    </div>
  );
}
