import type {
  BatchBookDraft,
  BatchChapterDraft,
} from '@/features/upload/model/types';
import {
  getFileTitle,
  isAudioFile,
  isDocumentFile,
} from '@/features/upload/utils/fileUtils';

function makeId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function naturalFileSort(a: File, b: File): number {
  const aPath = a.webkitRelativePath || a.name;
  const bPath = b.webkitRelativePath || b.name;
  return aPath.localeCompare(bPath, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function getPickedRootName(files: File[]): string {
  const first = files[0];
  if (!first) return '';
  const path = first.webkitRelativePath;
  if (!path) return '';
  return path.split('/').filter(Boolean)[0] ?? '';
}

export function createChapterDrafts(files: File[]): BatchChapterDraft[] {
  return files
    .filter(isDocumentFile)
    .sort(naturalFileSort)
    .map((file) => ({
      id: makeId('chapter'),
      title: getFileTitle(file.name),
      file,
    }));
}

function relativeParts(file: File): string[] {
  return (file.webkitRelativePath || file.name)
    .split('/')
    .filter(Boolean);
}

export function createSingleBookDraft(
  documentFiles: File[],
  audioFiles: File[] = [],
  fallbackTitle = 'Book',
): BatchBookDraft {
  const rootName = getPickedRootName(documentFiles) || fallbackTitle;
  return {
    id: makeId('book'),
    title: rootName,
    sourceKey: rootName.toLowerCase(),
    chapters: createChapterDrafts(documentFiles),
    audioFiles: audioFiles.filter(isAudioFile).sort(naturalFileSort),
    audioOffset: 0,
  };
}

export function createSeriesBookDrafts(
  documentFiles: File[],
  audioFiles: File[] = [],
): BatchBookDraft[] {
  const documentGroups = new Map<string, File[]>();
  const audioGroups = new Map<string, File[]>();

  const addToGroup = (map: Map<string, File[]>, key: string, file: File) => {
    map.set(key, [...(map.get(key) ?? []), file]);
  };

  for (const file of documentFiles.filter(isDocumentFile)) {
    const parts = relativeParts(file);
    const bookName = parts.length >= 3 ? parts[1] : 'Book 1';
    addToGroup(documentGroups, bookName, file);
  }

  for (const file of audioFiles.filter(isAudioFile)) {
    const parts = relativeParts(file);
    const bookName = parts.length >= 3 ? parts[1] : 'Book 1';
    addToGroup(audioGroups, bookName.toLowerCase(), file);
  }

  return Array.from(documentGroups.entries())
    .sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map(([bookName, files]) => ({
      id: makeId('book'),
      title: bookName,
      sourceKey: bookName.toLowerCase(),
      chapters: createChapterDrafts(files),
      audioFiles: (audioGroups.get(bookName.toLowerCase()) ?? []).sort(naturalFileSort),
      audioOffset: 0,
    }));
}

export function applySeriesAudioFiles(
  books: BatchBookDraft[],
  audioFiles: File[],
): BatchBookDraft[] {
  const grouped = new Map<string, File[]>();

  for (const file of audioFiles.filter(isAudioFile)) {
    const parts = relativeParts(file);
    const bookName = parts.length >= 3 ? parts[1] : 'Book 1';
    const key = bookName.toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), file]);
  }

  return books.map((book) => ({
    ...book,
    audioFiles: (grouped.get(book.sourceKey) ?? []).sort(naturalFileSort),
    audioOffset: 0,
  }));
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
