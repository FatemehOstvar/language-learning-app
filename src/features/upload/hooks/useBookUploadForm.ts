import { useCallback, useMemo, useState } from 'react';
import type { MediaFile } from '@/shared/api/supabase';
import type {
  BatchBookDraft,
  BookUploadType,
  UploadScope,
} from '@/features/upload/model/types';
import {
  applySeriesAudioFiles,
  createSeriesBookDrafts,
  createSingleBookDraft,
  getPickedRootName,
  moveItem,
} from '@/features/upload/utils/bookUploadUtils';
import { createBookBatch } from '@/features/upload/services/bookUploadService';
import { isAudioFile, isDocumentFile } from '@/features/upload/utils/fileUtils';

interface UseBookUploadFormOptions {
  scope: Exclude<UploadScope, 'lesson'>;
  onUploaded: (file: MediaFile) => void;
}

export function useBookUploadForm({ scope, onUploaded }: UseBookUploadFormOptions) {
  const [uploadType, setUploadType] = useState<BookUploadType>('audio-document');
  const [collectionTitle, setCollectionTitle] = useState('');
  const [books, setBooks] = useState<BatchBookDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleDocumentFolder = useCallback((files: File[]) => {
    resetMessages();
    const documents = files.filter(isDocumentFile);
    if (documents.length === 0) {
      setError('No PDF or EPUB chapter files were found in that folder.');
      return;
    }

    if (scope === 'series') {
      const nextBooks = createSeriesBookDrafts(documents);
      setBooks(nextBooks);
      setCollectionTitle((current) => current.trim() || getPickedRootName(files));
      return;
    }

    const book = createSingleBookDraft(documents);
    setBooks([book]);
    setCollectionTitle(book.title);
  }, [resetMessages, scope]);

  const handleAudioFolder = useCallback((files: File[]) => {
    resetMessages();
    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length === 0) {
      setError('No supported audio files were found in that folder.');
      return;
    }

    setBooks((current) => {
      if (scope === 'series') {
        return applySeriesAudioFiles(current, audioFiles);
      }

      if (current.length === 0) return current;
      const next = [...current];
      next[0] = {
        ...next[0],
        audioFiles: [...audioFiles].sort((a, b) =>
          (a.webkitRelativePath || a.name).localeCompare(
            b.webkitRelativePath || b.name,
            undefined,
            { numeric: true, sensitivity: 'base' },
          ),
        ),
        audioOffset: 0,
      };
      return next;
    });
  }, [resetMessages, scope]);

  const clearDocuments = useCallback(() => {
    setBooks([]);
    setCollectionTitle('');
    resetMessages();
  }, [resetMessages]);

  const clearAudio = useCallback(() => {
    setBooks((current) =>
      current.map((book) => ({ ...book, audioFiles: [], audioOffset: 0 })),
    );
    resetMessages();
  }, [resetMessages]);

  const updateBook = useCallback(
    (bookId: string, updater: (book: BatchBookDraft) => BatchBookDraft) => {
      setBooks((current) =>
        current.map((book) => (book.id === bookId ? updater(book) : book)),
      );
      resetMessages();
    },
    [resetMessages],
  );

  const canSubmit = useMemo(() => {
    if (uploading || books.length === 0) return false;
    if (scope === 'series' && !collectionTitle.trim()) return false;

    for (const book of books) {
      if (!book.title.trim() || book.chapters.length === 0) return false;
      if (book.chapters.some((chapter) => !chapter.title.trim())) return false;

      if (uploadType === 'audio-document') {
        const everyChapterHasAudio = book.chapters.every((_, chapterIndex) => {
          const audioIndex = chapterIndex - book.audioOffset;
          return audioIndex >= 0 && audioIndex < book.audioFiles.length;
        });
        if (!everyChapterHasAudio) return false;
      }
    }

    return true;
  }, [books, collectionTitle, scope, uploadType, uploading]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setError(
        uploadType === 'audio-document'
          ? 'Every chapter needs a matched audio file before the book can be saved.'
          : 'Add at least one chapter and make sure every title is filled in.',
      );
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      const created = await createBookBatch({
        scope,
        collectionTitle:
          scope === 'series' ? collectionTitle.trim() : books[0].title.trim(),
        uploadType,
        books,
        onProgress: setProgress,
        onMessage: setProgressMessage,
      });

      if (created[0]) onUploaded(created[0]);
      setSuccess(true);
      setBooks([]);
      setCollectionTitle('');
      setProgress(100);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'The book could not be created.',
      );
    } finally {
      setUploading(false);
      setProgressMessage('');
    }
  }, [books, canSubmit, collectionTitle, onUploaded, scope, uploadType]);

  return {
    uploadType,
    collectionTitle,
    books,
    uploading,
    progress,
    progressMessage,
    error,
    success,
    canSubmit,
    setUploadType: (value: BookUploadType) => {
      setUploadType(value);
      resetMessages();
    },
    setCollectionTitle: (value: string) => {
      setCollectionTitle(value);
      resetMessages();
    },
    handleDocumentFolder,
    handleAudioFolder,
    clearDocuments,
    clearAudio,
    updateBook,
    moveChapter: (bookId: string, from: number, to: number) =>
      updateBook(bookId, (book) => ({
        ...book,
        chapters: moveItem(book.chapters, from, to),
      })),
    moveAudio: (bookId: string, from: number, to: number) =>
      updateBook(bookId, (book) => ({
        ...book,
        audioFiles: moveItem(book.audioFiles, from, to),
      })),
    shiftAudio: (bookId: string, delta: number) =>
      updateBook(bookId, (book) => ({
        ...book,
        audioOffset: Math.max(
          -book.audioFiles.length,
          Math.min(book.chapters.length, book.audioOffset + delta),
        ),
      })),
    handleSubmit,
  };
}
