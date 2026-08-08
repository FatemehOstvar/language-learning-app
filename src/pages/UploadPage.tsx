import { useState } from 'react';
import LessonTypeSelector from '@/features/upload/components/LessonTypeSelector';
import LessonUploadForm from '@/features/upload/components/LessonUploadForm';
import UploadHeader from '@/features/upload/components/UploadHeader';
import UploadScopeSelector from '@/features/upload/components/UploadScopeSelector';
import BookUploadForm from '@/features/upload/components/BookUploadForm';
import { useUploadForm } from '@/features/upload/hooks/useUploadForm';
import type { UploadPageProps, UploadScope } from '@/features/upload/model/types';

export default function UploadPage({ onUploaded, onGoToPlayer }: UploadPageProps) {
  const [scope, setScope] = useState<UploadScope>('lesson');
  const form = useUploadForm({ onUploaded });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50/50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <UploadHeader />
        <div className="mt-4 space-y-2">
          <UploadScopeSelector value={scope} onChange={setScope} />
          {scope === 'lesson' ? (
            <>
              <LessonTypeSelector activeTab={form.tab} onChange={form.handleTabChange} />
              <LessonUploadForm form={form} onGoToPlayer={onGoToPlayer} />
            </>
          ) : (
            <BookUploadForm
              key={scope}
              scope={scope}
              onUploaded={onUploaded}
              onGoToPlayer={onGoToPlayer}
            />
          )}
        </div>
      </div>
    </div>
  );
}
