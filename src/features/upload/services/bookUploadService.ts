import { supabase, type MediaFile } from '@/shared/api/supabase';
import { deleteLesson } from '@/features/library/api/library';
import { makeSeriesFolderName } from '@/features/library/utils/folderNaming';
import {
  createAudioDocumentLesson,
  createDocumentLesson,
} from '@/features/upload/services/lessonUploadService';
import type {
  BatchBookDraft,
  BookUploadType,
  UploadScope,
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

        if (uploadType === 'audio-document') {
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

    await Promise.allSettled(
      createdFolderIds.map((folderId) =>
        supabase.from('library_folders').delete().eq('id', folderId),
      ),
    );

    throw error;
  }
}
