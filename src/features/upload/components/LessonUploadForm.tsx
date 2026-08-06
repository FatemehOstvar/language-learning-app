import AudioDocumentFields from '@/features/upload/components/AudioDocumentFields';
import AudioSubtitleFields from '@/features/upload/components/AudioSubtitleFields';
import DocumentLessonFields from '@/features/upload/components/DocumentLessonFields';
import LessonTitleField from '@/features/upload/components/LessonTitleField';
import TextLessonFields from '@/features/upload/components/TextLessonFields';
import UploadFormFooter from '@/features/upload/components/UploadFormFooter';
import UploadProgress from '@/features/upload/components/UploadProgress';
import UploadSuccessNotice from '@/features/upload/components/UploadSuccessNotice';
import type { useUploadForm } from '@/features/upload/hooks/useUploadForm';

interface LessonUploadFormProps {
  form: ReturnType<typeof useUploadForm>;
  onGoToPlayer: () => void;
}

export default function LessonUploadForm({
  form,
  onGoToPlayer,
}: LessonUploadFormProps) {
  return (
    <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-6 p-5 sm:p-6">
        <LessonTitleField
          value={form.lessonTitle}
          disabled={form.uploading}
          onChange={form.handleTitleChange}
        />

        <div className="h-px bg-slate-100" />

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

        {form.tab === 'audio-subtitle' && (
          <AudioSubtitleFields
            audioFile={form.audioFile}
            subtitleFile={form.subtitleFile}
            dragging={form.dragging}
            disabled={form.uploading}
            audioInputRef={form.audioInputRef}
            subtitleInputRef={form.subtitleInputRef}
            onAudioFile={form.handleAudioFile}
            onSubtitleFile={form.handleSubtitleFile}
            onRemoveAudio={form.removeAudioFile}
            onRemoveSubtitle={form.removeSubtitleFile}
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

        <UploadProgress
          tab={form.tab}
          uploading={form.uploading}
          progress={form.progress}
          message={form.progressMessage}
          error={form.error}
        />

        <UploadSuccessNotice
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
