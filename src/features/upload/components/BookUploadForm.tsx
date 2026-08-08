import { FileText, Headphones, Loader2 } from 'lucide-react';
import DirectoryPicker from '@/features/upload/components/DirectoryPicker';
import BookDraftEditor from '@/features/upload/components/BookDraftEditor';
import UploadSuccessNotice from '@/features/upload/components/UploadSuccessNotice';
import { useBookUploadForm } from '@/features/upload/hooks/useBookUploadForm';
import type { MediaFile } from '@/shared/api/supabase';
import type { UploadScope } from '@/features/upload/model/types';

interface BookUploadFormProps {
  scope: Exclude<UploadScope, 'lesson'>;
  onUploaded: (file: MediaFile) => void;
  onGoToPlayer: () => void;
}

export default function BookUploadForm({
  scope,
  onUploaded,
  onGoToPlayer,
}: BookUploadFormProps) {
  const form = useBookUploadForm({ scope, onUploaded });
  const chapterCount = form.books.reduce((sum, book) => sum + book.chapters.length, 0);
  const audioCount = form.books.reduce((sum, book) => sum + book.audioFiles.length, 0);

  return (
    <main className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <TypeButton
            active={form.uploadType === 'audio-document'}
            onClick={() => form.setUploadType('audio-document')}
            icon={Headphones}
            label="Audio + doc"
            disabled={form.uploading}
          />
          <TypeButton
            active={form.uploadType === 'document'}
            onClick={() => form.setUploadType('document')}
            icon={FileText}
            label="Document"
            disabled={form.uploading}
          />
        </div>

        {scope === 'series' && (
          <input
            aria-label="Series title"
            value={form.collectionTitle}
            disabled={form.uploading}
            onChange={(event) => form.setCollectionTitle(event.target.value)}
            placeholder="Series title"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          />
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <DirectoryPicker
            label={scope === 'series' ? 'Books' : 'Chapters'}
            description={scope === 'series' ? 'Series folder with book subfolders' : 'Book folder with PDF/EPUB chapters'}
            summary={chapterCount ? `${form.books.length} book${form.books.length === 1 ? '' : 's'} · ${chapterCount} chapter${chapterCount === 1 ? '' : 's'}` : null}
            disabled={form.uploading}
            onFiles={form.handleDocumentFolder}
            onClear={form.clearDocuments}
          />

          {form.uploadType === 'audio-document' && (
            <DirectoryPicker
              label="Audio"
              description={scope === 'series' ? 'Matching book subfolders' : 'Audio files in chapter order'}
              summary={audioCount ? `${audioCount} files` : null}
              disabled={form.uploading || form.books.length === 0}
              onFiles={form.handleAudioFolder}
              onClear={form.clearAudio}
            />
          )}
        </div>

        {form.books.length > 0 && (
          <div className="space-y-2">
            {form.books.map((book) => (
              <BookDraftEditor
                key={book.id}
                book={book}
                withAudio={form.uploadType === 'audio-document'}
                disabled={form.uploading}
                onBookTitleChange={(value) =>
                  form.updateBook(book.id, (current) => ({ ...current, title: value }))
                }
                onChapterTitleChange={(chapterId, value) =>
                  form.updateBook(book.id, (current) => ({
                    ...current,
                    chapters: current.chapters.map((chapter) =>
                      chapter.id === chapterId ? { ...chapter, title: value } : chapter,
                    ),
                  }))
                }
                onMoveChapter={(from, to) => form.moveChapter(book.id, from, to)}
                onMoveAudio={(from, to) => form.moveAudio(book.id, from, to)}
                onShiftAudio={(delta) => form.shiftAudio(book.id, delta)}
              />
            ))}
          </div>
        )}

        {form.error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {form.error}
          </div>
        )}

        {form.uploading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex min-w-0 items-center gap-2 truncate">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                {form.progressMessage || 'Saving…'}
              </span>
              <span className="tabular-nums">{form.progress}%</span>
            </div>
          </div>
        )}

        <UploadSuccessNotice
          visible={form.success}
          onOpenLesson={onGoToPlayer}
          message="Done"
          actionLabel="Open"
        />
      </div>

      <footer className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <button
          type="button"
          disabled={!form.canSubmit}
          onClick={() => void form.handleSubmit()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {form.uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {form.uploading ? 'Saving…' : 'Create'}
        </button>
      </footer>
    </main>
  );
}

function TypeButton({
  active,
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Headphones;
  label: string;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
