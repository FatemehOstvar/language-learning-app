import { supabase, type MediaFile } from '@/shared/api/supabase';
import { deleteLesson } from '@/features/library/api/library';
import { makeSeriesFolderName } from '@/features/library/utils/folderNaming';
import {
  createAudioDocumentLesson,
  createDocumentLesson,
} from '@/features/upload/services/lessonUploadService';
import {
  uploadStorageFile,
  removeUploadedFiles,
} from '@/features/upload/services/storageUploadService';
import {
  AUDIO_BUCKET,
  DOCUMENT_BUCKET,
} from '@/features/upload/config/uploadConfig';
import { encodeDocumentSliceHash } from '@/shared/utils/documentSlice';
import type {
  BatchBookDraft,
  BatchChapterDraft,
  BookUploadType,
  UploadScope,
  UploadedStorageFile,
} from '@/features/upload/model/types';

interface CreateBookBatchInput {
  scope: Exclude<UploadScope, 'lesson'>;
  collectionTitle: string;
  uploadType: BookUploadType;
  books: BatchBookDraft[];
  onProgress: (progress: number) => void;
  onMessage: (message: string) => void;
}

interface CreatedFolder {
  id: string;
}

async function createBookFolder(
  title: string,
  sortOrder: number,
  seriesName: string | null,
): Promise<CreatedFolder> {
  const name = seriesName
    ? makeSeriesFolderName(seriesName, title)
    : title.trim();

  const { data, error } = await supabase
    .from('library_folders')
    .insert({
      name,
      sort_order: sortOrder,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data as CreatedFolder;
}

function getMatchedAudio(
  book: BatchBookDraft,
  chapterIndex: number,
): File | null {
  const audioIndex = chapterIndex - book.audioOffset;
  if (audioIndex < 0 || audioIndex >= book.audioFiles.length) return null;
  return book.audioFiles[audioIndex];
}

function isSharedSourceBook(book: BatchBookDraft): boolean {
  const source = book.sourceDocument;
  if (!source || book.chapters.length === 0) return false;

  return book.chapters.every(
    (chapter) => chapter.file === source.file && Boolean(chapter.slice),
  );
}

async function insertSharedDocumentChapter({
  chapter,
  folderId,
  sortOrder,
  document,
  uploadType,
  audioFile,
  onProgress,
  onMessage,
  uploadedBatchFiles,
}: {
  chapter: BatchChapterDraft;
  folderId: string;
  sortOrder: number;
  document: UploadedStorageFile;
  uploadType: BookUploadType;
  audioFile: File | null;
  onProgress: (progress: number) => void;
  onMessage: (message: string) => void;
  uploadedBatchFiles: Array<{ bucket: string; path: string }>;
}): Promise<MediaFile> {
  const documentUrl = `${document.publicUrl}${encodeDocumentSliceHash(chapter.slice)}`;

  if (uploadType === 'document') {
    onMessage('Creating chapter…');
    const { data, error } = await supabase
      .from('media_files')
      .insert({
        title: chapter.title.trim(),
        media_type: 'document',
        content: documentUrl,
        source_filename: chapter.file.name,
        folder_id: folderId,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) throw error;
    onProgress(100);
    return data as MediaFile;
  }

  if (!audioFile) {
    throw new Error(`Chapter ${sortOrder + 1} has no audio.`);
  }

  onMessage('Uploading audio…');
  const uploadedAudio = await uploadStorageFile({
    bucket: AUDIO_BUCKET,
    file: audioFile,
    onProgress: (value) => onProgress(Math.round(value * 0.85)),
  });
  uploadedBatchFiles.push({ bucket: AUDIO_BUCKET, path: uploadedAudio.path });

  onMessage('Creating chapter…');
  const { data, error } = await supabase
    .from('media_files')
    .insert({
      title: chapter.title.trim(),
      media_type: 'audio_document',
      audio_url: uploadedAudio.publicUrl,
      audio_filename: audioFile.name,
      content: documentUrl,
      source_filename: chapter.file.name,
      folder_id: folderId,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  onProgress(100);
  return data as MediaFile;
}

export async function createBookBatch({
  scope,
  collectionTitle,
  uploadType,
  books,
  onProgress,
  onMessage,
}: CreateBookBatchInput): Promise<MediaFile[]> {
  const createdLessons: MediaFile[] = [];
  const createdFolderIds: string[] = [];
  const uploadedBatchFiles: Array<{ bucket: string; path: string }> = [];
  const seriesName = scope === 'series' ? collectionTitle.trim() : null;

  const totalChapters = books.reduce(
    (sum, book) => sum + book.chapters.length,
    0,
  );
  let completedChapters = 0;

  try {
    for (let bookIndex = 0; bookIndex < books.length; bookIndex += 1) {
      const book = books[bookIndex];
      onMessage(book.title);

      const folder = await createBookFolder(
        book.title,
        bookIndex,
        seriesName,
      );
      createdFolderIds.push(folder.id);

      let sharedDocument: UploadedStorageFile | null = null;
      if (isSharedSourceBook(book) && book.sourceDocument) {
        onMessage(`${book.title} · document`);
        sharedDocument = await uploadStorageFile({
          bucket: DOCUMENT_BUCKET,
          file: book.sourceDocument.file,
          onProgress: (value) => {
            const beforeBook = totalChapters
              ? (completedChapters / totalChapters) * 100
              : 0;
            const oneChapterShare = totalChapters ? 100 / totalChapters : 100;
            onProgress(
              Math.min(99, Math.round(beforeBook + oneChapterShare * 0.35 * (value / 100))),
            );
          },
        });
        uploadedBatchFiles.push({
          bucket: DOCUMENT_BUCKET,
          path: sharedDocument.path,
        });
      }

      for (
        let chapterIndex = 0;
        chapterIndex < book.chapters.length;
        chapterIndex += 1
      ) {
        const chapter = book.chapters[chapterIndex];
        const baseProgress = totalChapters
          ? (completedChapters / totalChapters) * 100
          : 0;
        const chapterShare = totalChapters ? 100 / totalChapters : 100;

        const setChapterProgress = (value: number) => {
          onProgress(
            Math.min(
              99,
              Math.round(baseProgress + chapterShare * (value / 100)),
            ),
          );
        };

        onMessage(`${book.title} · ${chapterIndex + 1}/${book.chapters.length}`);

        let lesson: MediaFile;

        if (sharedDocument) {
          lesson = await insertSharedDocumentChapter({
            chapter,
            folderId: folder.id,
            sortOrder: chapterIndex,
            document: sharedDocument,
            uploadType,
            audioFile:
              uploadType === 'audio-document'
                ? getMatchedAudio(book, chapterIndex)
                : null,
            onProgress: setChapterProgress,
            onMessage,
            uploadedBatchFiles,
          });
        } else if (uploadType === 'audio-document') {
          const audioFile = getMatchedAudio(book, chapterIndex);
          if (!audioFile) {
            throw new Error(
              `${book.title}: chapter ${chapterIndex + 1} has no audio.`,
            );
          }

          lesson = await createAudioDocumentLesson({
            title: chapter.title,
            audioFile,
            companionFile: chapter.file,
            folderId: folder.id,
            sortOrder: chapterIndex,
            onProgress: setChapterProgress,
            onMessage,
          });
        } else {
          lesson = await createDocumentLesson({
            title: chapter.title,
            documentFile: chapter.file,
            folderId: folder.id,
            sortOrder: chapterIndex,
            onProgress: setChapterProgress,
            onMessage,
          });
        }

        createdLessons.push(lesson);
        completedChapters += 1;
        onProgress(
          Math.min(
            99,
            Math.round((completedChapters / totalChapters) * 100),
          ),
        );
      }
    }

    onProgress(100);
    return createdLessons;
  } catch (error) {
    await Promise.allSettled(
      createdLessons.map((lesson) => deleteLesson(lesson)),
    );

    await removeUploadedFiles(uploadedBatchFiles);

    await Promise.allSettled(
      createdFolderIds.map((folderId) =>
        supabase.from('library_folders').delete().eq('id', folderId),
      ),
    );

    throw error;
  }
}
