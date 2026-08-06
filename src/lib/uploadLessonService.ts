import { supabase, type MediaFile } from '@/lib/supabase';
import { normalizeAndSplitSentences } from '@/lib/textParser';
import {
  AUDIO_BUCKET,
  DOCUMENT_BUCKET,
} from '@/lib/uploadConstants';
import { getDocumentType } from '@/lib/uploadFileUtils';
import {
  removeUploadedFiles,
  uploadStorageFile,
} from '@/lib/uploadStorage';
import type { UploadedStorageFile } from '@/lib/uploadTypes';

interface UploadProgressCallbacks {
  onProgress: (progress: number) => void;
  onMessage: (message: string) => void;
}

interface AudioDocumentLessonInput extends UploadProgressCallbacks {
  title: string;
  audioFile: File;
  companionFile: File;
}

interface DocumentLessonInput extends UploadProgressCallbacks {
  title: string;
  documentFile: File;
}

interface TextLessonInput {
  title: string;
  text: string;
  onMessage: (message: string) => void;
}

export async function createAudioDocumentLesson({
  title,
  audioFile,
  companionFile,
  onProgress,
  onMessage,
}: AudioDocumentLessonInput): Promise<MediaFile> {
  let uploadedAudio: UploadedStorageFile | undefined;
  let uploadedDocument: UploadedStorageFile | undefined;

  try {
    onMessage('Uploading audio…');
    uploadedAudio = await uploadStorageFile({
      bucket: AUDIO_BUCKET,
      file: audioFile,
      onProgress: (progress) => onProgress(Math.round(progress * 0.55)),
    });

    onMessage('Uploading companion document…');
    uploadedDocument = await uploadStorageFile({
      bucket: DOCUMENT_BUCKET,
      file: companionFile,
      onProgress: (progress) =>
        onProgress(55 + Math.round(progress * 0.45)),
    });

    onMessage('Creating lesson…');
    const { data, error } = await supabase
      .from('media_files')
      .insert({
        title: title.trim(),
        media_type: 'audio_document',
        audio_url: uploadedAudio.publicUrl,
        audio_filename: audioFile.name,
        document_url: uploadedDocument.publicUrl,
        document_filename: companionFile.name,
        document_type: getDocumentType(companionFile),
      })
      .select()
      .single();

    if (error) throw error;
    onProgress(100);
    return data as MediaFile;
  } catch (error) {
    await removeUploadedFiles([
      uploadedAudio && { bucket: AUDIO_BUCKET, path: uploadedAudio.path },
      uploadedDocument && {
        bucket: DOCUMENT_BUCKET,
        path: uploadedDocument.path,
      },
    ]);
    throw error;
  }
}

export async function createDocumentLesson({
  title,
  documentFile,
  onProgress,
  onMessage,
}: DocumentLessonInput): Promise<MediaFile> {
  let uploadedDocument: UploadedStorageFile | undefined;

  try {
    onMessage('Uploading document…');
    uploadedDocument = await uploadStorageFile({
      bucket: DOCUMENT_BUCKET,
      file: documentFile,
      onProgress,
    });

    onMessage('Creating lesson…');
    const { data, error } = await supabase
      .from('media_files')
      .insert({
        title: title.trim(),
        media_type: 'document',
        document_url: uploadedDocument.publicUrl,
        document_filename: documentFile.name,
        document_type: getDocumentType(documentFile),
      })
      .select()
      .single();

    if (error) throw error;
    onProgress(100);
    return data as MediaFile;
  } catch (error) {
    await removeUploadedFiles([
      uploadedDocument && {
        bucket: DOCUMENT_BUCKET,
        path: uploadedDocument.path,
      },
    ]);
    throw error;
  }
}

export async function createTextLesson({
  title,
  text,
  onMessage,
}: TextLessonInput): Promise<MediaFile> {
  onMessage('Creating lesson…');
  const content = normalizeAndSplitSentences(text).join('\n');

  const { data, error } = await supabase
    .from('media_files')
    .insert({
      title: title.trim(),
      media_type: 'text',
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MediaFile;
}
