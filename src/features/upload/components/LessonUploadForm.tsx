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
    <main className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="space-y-3 p-4 sm:p-5">
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
            sourceFileName={form.textSourceFileName}
            onChange={form.handleTextChange}
            onTextFile={form.handleTextFile}
          />
        )}

        <UploadProgress
          tab={form.tab}
          uploading={form.uploading}
          progress={form.progress}
          message={form.progressMessage}
          error={form.error}
        />
        <UploadSuccessNotice visible={form.success} onOpenLesson={onGoToPlayer} />
      </div>

      <UploadFormFooter
        uploading={form.uploading}
        canSubmit={form.canSubmit}
        label={form.tab === 'textbox' ? 'Accept' : 'Create'}
        onSubmit={() => void form.handleSubmit()}
      />
    </main>
  );
}
