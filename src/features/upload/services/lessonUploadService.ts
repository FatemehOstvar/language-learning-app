import { supabase, type MediaFile } from '@/shared/api/supabase';
import { parseSrt } from '@/shared/utils/srtParser';
import { normalizeAndSplitSentences } from '@/shared/utils/textParser';
import {
  AUDIO_BUCKET,
  DOCUMENT_BUCKET,
} from '@/features/upload/config/uploadConfig';
import { getFileExtension } from '@/features/upload/utils/fileUtils';
import {
  removeUploadedFiles,
  uploadStorageFile,
} from '@/features/upload/services/storageUploadService';
import type { UploadedStorageFile } from '@/features/upload/model/types';

interface UploadProgressCallbacks {
  onProgress: (progress: number) => void;
  onMessage: (message: string) => void;
}

interface AudioDocumentLessonInput extends UploadProgressCallbacks {
  title: string;
  audioFile: File;
  companionFile: File;
  folderId?: string | null;
  sortOrder?: number;
}

interface AudioSubtitleLessonInput extends UploadProgressCallbacks {
  title: string;
  audioFile: File;
  subtitleFile: File;
}

interface DocumentLessonInput extends UploadProgressCallbacks {
  title: string;
  documentFile: File;
  folderId?: string | null;
  sortOrder?: number;
}

interface TextLessonInput {
  title: string;
  text: string;
  sourceFilename?: string | null;
  onMessage: (message: string) => void;
}

function normalizeTimestamp(timestamp: string): string {
  const clean = timestamp.trim().replace('.', ',');
  const parts = clean.split(':');

  if (parts.length === 2) {
    return `00:${clean}`;
  }

  return clean;
}

function convertWebVttToSrt(content: string): string {
  const normalized = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim();

  const withoutHeader = normalized.replace(
    /^WEBVTT[^\n]*(?:\n(?:[^\n].*)?)*?\n\s*\n/i,
    '',
  );

  const blocks = withoutHeader.split(/\n\s*\n/);
  const cues: string[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;
    if (/^(NOTE|STYLE|REGION)(?:\s|$)/i.test(lines[0])) continue;

    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex === -1) continue;

    const [rawStart, rawEndWithSettings] = lines[timingIndex]
      .split('-->')
      .map((value) => value.trim());

    if (!rawStart || !rawEndWithSettings) continue;

    const rawEnd = rawEndWithSettings.split(/\s+/)[0];
    const text = lines.slice(timingIndex + 1).join(' ').trim();
    if (!text) continue;

    cues.push(
      `${cues.length + 1}\n${normalizeTimestamp(rawStart)} --> ${normalizeTimestamp(rawEnd)}\n${text}`,
    );
  }

  return cues.join('\n\n');
}

async function readSubtitleFile(file: File): Promise<string> {
  const raw = (await file.text()).replace(/^\uFEFF/, '').trim();

  if (!raw) {
    throw new Error('The subtitle file is empty.');
  }

  const extension = getFileExtension(file.name);
  const srtContent =
    extension === 'vtt' || /^WEBVTT(?:\s|$)/i.test(raw)
      ? convertWebVttToSrt(raw)
      : raw.replace(/\r\n?/g, '\n');

  if (parseSrt(srtContent).length === 0) {
    throw new Error(
      'No timed subtitle cues were found. Use a valid SRT or WebVTT file.',
    );
  }

  return srtContent;
}

export async function createAudioDocumentLesson({
  title,
  audioFile,
  companionFile,
  folderId = null,
  sortOrder = 0,
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
        content: uploadedDocument.publicUrl,
        source_filename: companionFile.name,
        folder_id: folderId,
        sort_order: sortOrder,
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

export async function createAudioSubtitleLesson({
  title,
  audioFile,
  subtitleFile,
  onProgress,
  onMessage,
}: AudioSubtitleLessonInput): Promise<MediaFile> {
  let uploadedAudio: UploadedStorageFile | undefined;

  try {
    onMessage('Reading subtitles…');
    const srtContent = await readSubtitleFile(subtitleFile);
    onProgress(5);

    onMessage('Uploading audio…');
    uploadedAudio = await uploadStorageFile({
      bucket: AUDIO_BUCKET,
      file: audioFile,
      onProgress: (progress) =>
        onProgress(5 + Math.round(progress * 0.9)),
    });

    onMessage('Creating lesson…');
    const { data, error } = await supabase
      .from('media_files')
      .insert({
        title: title.trim(),
        media_type: 'audio',
        audio_url: uploadedAudio.publicUrl,
        audio_filename: audioFile.name,
        srt_content: srtContent,
        srt_filename: subtitleFile.name,
        folder_id: null,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) throw error;
    onProgress(100);
    return data as MediaFile;
  } catch (error) {
    await removeUploadedFiles([
      uploadedAudio && { bucket: AUDIO_BUCKET, path: uploadedAudio.path },
    ]);
    throw error;
  }
}

export async function createDocumentLesson({
  title,
  documentFile,
  folderId = null,
  sortOrder = 0,
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
        content: uploadedDocument.publicUrl,
        source_filename: documentFile.name,
        folder_id: folderId,
        sort_order: sortOrder,
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
  sourceFilename = null,
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
      source_filename: sourceFilename?.trim() || null,
      folder_id: null,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MediaFile;
}
