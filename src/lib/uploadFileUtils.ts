import type { RefObject } from 'react';
import {
  AUDIO_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
} from '@/lib/uploadConstants';
import type { UploadDocumentType } from '@/lib/uploadTypes';

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() ?? '';
}

export function getFileTitle(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

export function isAudioFile(file: File): boolean {
  return (
    file.type.startsWith('audio/') ||
    AUDIO_EXTENSIONS.has(getFileExtension(file.name))
  );
}

export function isDocumentFile(file: File): boolean {
  return DOCUMENT_EXTENSIONS.has(getFileExtension(file.name));
}

export function getDocumentType(file: File): UploadDocumentType {
  const extension = getFileExtension(file.name);

  if (extension !== 'pdf' && extension !== 'epub') {
    throw new Error('Unsupported document type.');
  }

  return extension;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 bytes';

  const units = ['bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / 1024 ** unitIndex;

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function createStoragePath(file: File): string {
  const extension = getFileExtension(file.name);
  const identifier =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return extension ? `${identifier}.${extension}` : identifier;
}

export function clearFileInput(
  inputRef: RefObject<HTMLInputElement>,
): void {
  if (inputRef.current) inputRef.current.value = '';
}
