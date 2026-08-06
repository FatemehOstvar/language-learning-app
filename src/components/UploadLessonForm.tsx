import AudioDocumentFields from '@/components/AudioDocumentFields';
import DocumentLessonFields from '@/components/DocumentLessonFields';
import LessonTitleField from '@/components/LessonTitleField';
import TextLessonFields from '@/components/TextLessonFields';
import UploadFormFooter from '@/components/UploadFormFooter';
import UploadStatus from '@/components/UploadStatus';
import UploadSuccessBanner from '@/components/UploadSuccessBanner';
import type { useUploadForm } from '@/lib/useUploadForm';

interface UploadLessonFormProps {
  form: ReturnType<typeof useUploadForm>;
  onGoToPlayer: () => void;
}

export default function UploadLessonForm({
  form,
  onGoToPlayer,
}: UploadLessonFormProps) {

  return (
    <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
        <p className="text-sm font-semibold text-slate-900">Lesson details</p>
        <p className="mt-1 text-sm text-slate-500">
          Add a clear title and choose the lesson files.
        </p>
      </div>

      <div className="space-y-7 px-6 py-7 sm:px-8">
        <LessonTitleField
          value={form.lessonTitle}
          disabled={form.uploading}
          onChange={form.handleTitleChange}
        />

        {form.tab === 'audio-document' && (
          <AudioDocumentFields
            audioFile={form.audioFile}
            companionFile={form.companionFile}
            dragging={form.dragging}
            disabled={form.uploading}
            audioInputRef={form.audioInputRef}
            companionInputRef={form.companionInputRef}
            onAudioFile={form.handleAudioFile}
            onCompanionFile={form.handleCompanionFile}
            onRemoveAudio={form.removeAudioFile}
            onRemoveCompanion={form.removeCompanionFile}
            onDraggingChange={form.setDragging}
          />
        )}

        {form.tab === 'document' && (
          <DocumentLessonFields
            file={form.documentFile}
            dragging={form.dragging}
            disabled={form.uploading}
            inputRef={form.documentInputRef}
            onFile={form.handleDocumentFile}
            onRemove={form.removeDocumentFile}
            onDraggingChange={form.setDragging}
          />
        )}

        {form.tab === 'textbox' && (
          <TextLessonFields
            value={form.textBoxContent}
            wordCount={form.wordCount}
            disabled={form.uploading}
            onChange={form.handleTextChange}
          />
        )}

        <UploadStatus
          tab={form.tab}
          uploading={form.uploading}
          progress={form.progress}
          message={form.progressMessage}
          error={form.error}
        />

        <UploadSuccessBanner
          visible={form.success}
          onOpenLesson={onGoToPlayer}
        />
      </div>

      <UploadFormFooter
        uploading={form.uploading}
        canSubmit={form.canSubmit}
        onSubmit={() => void form.handleSubmit()}
      />
    </main>
  );
}
