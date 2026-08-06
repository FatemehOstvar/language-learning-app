import {
  supabase,
  type LibraryFolder,
  type MediaFile,
} from '@/shared/api/supabase';
import type {
  LessonOrderUpdate,
} from '@/features/library/model/types';

function hydrateDocumentFields(lesson: MediaFile): MediaFile {
  const hasDocument =
    lesson.media_type === 'document' ||
    lesson.media_type === 'audio_document';

  if (!hasDocument) {
    return lesson;
  }

  const filename = lesson.source_filename;
  const lowercaseFilename = filename?.toLowerCase() ?? '';

  const documentType =
    lowercaseFilename.endsWith('.pdf')
      ? 'pdf'
      : lowercaseFilename.endsWith('.epub')
        ? 'epub'
        : null;

  return {
    ...lesson,
    document_url: lesson.content,
    document_filename: filename,
    document_type: documentType,
  };
}

function throwIfError(
  error: { message: string } | null,
) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchLibraryFolders(): Promise<LibraryFolder[]> {
  const { data, error } = await supabase
    .from('library_folders')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  throwIfError(error);
  return (data ?? []) as LibraryFolder[];
}

export async function fetchLibraryLessons(): Promise<MediaFile[]> {
  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return ((data ?? []) as MediaFile[]).map(hydrateDocumentFields);
}

export async function createLibraryFolder(
  name: string,
  sortOrder: number,
): Promise<LibraryFolder> {
  const { data, error } = await supabase
    .from('library_folders')
    .insert({
      name: name.trim(),
      sort_order: sortOrder,
    })
    .select()
    .single();

  throwIfError(error);
  return data as LibraryFolder;
}

export async function renameLibraryFolder(
  id: string,
  name: string,
): Promise<LibraryFolder> {
  const { data, error } = await supabase
    .from('library_folders')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data as LibraryFolder;
}

export async function deleteLibraryFolder(
  id: string,
): Promise<void> {
  const { error: moveError } = await supabase
    .from('media_files')
    .update({ folder_id: null })
    .eq('folder_id', id);

  throwIfError(moveError);

  const { error: deleteError } = await supabase
    .from('library_folders')
    .delete()
    .eq('id', id);

  throwIfError(deleteError);
}

export async function renameLesson(
  id: string,
  title: string,
): Promise<MediaFile> {
  const { data, error } = await supabase
    .from('media_files')
    .update({ title: title.trim() })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data as MediaFile;
}

export async function moveLesson(
  id: string,
  folderId: string | null,
  sortOrder: number,
): Promise<MediaFile> {
  const { data, error } = await supabase
    .from('media_files')
    .update({
      folder_id: folderId,
      sort_order: sortOrder,
    })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data as MediaFile;
}

export async function saveLessonOrder(
  updates: LessonOrderUpdate[],
): Promise<void> {
  await Promise.all(
    updates.map(async ({ id, sort_order }) => {
      const { error } = await supabase
        .from('media_files')
        .update({ sort_order })
        .eq('id', id);

      throwIfError(error);
    }),
  );
}

function extractStoragePath(
  publicUrl: string | null,
  bucket: string,
): string | null {
  if (!publicUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(
    publicUrl.slice(markerIndex + marker.length),
  );
}

async function removeStoredLessonFiles(
  lesson: MediaFile,
): Promise<void> {
  const removals: Promise<unknown>[] = [];

  const audioPath = extractStoragePath(
    lesson.audio_url,
    'audio',
  );

  if (audioPath) {
    removals.push(
      supabase.storage
        .from('audio')
        .remove([audioPath]),
    );
  }

  const documentUrl =
    lesson.document_url ??
    (lesson.media_type === 'document' ||
    lesson.media_type === 'audio_document'
      ? lesson.content
      : null);

  const documentPath = extractStoragePath(
    documentUrl,
    'documents',
  );

  if (documentPath) {
    removals.push(
      supabase.storage
        .from('documents')
        .remove([documentPath]),
    );
  }

  await Promise.allSettled(removals);
}

export async function deleteLesson(
  lesson: MediaFile,
): Promise<void> {
  const { error } = await supabase
    .from('media_files')
    .delete()
    .eq('id', lesson.id);

  throwIfError(error);
  await removeStoredLessonFiles(lesson);
}
