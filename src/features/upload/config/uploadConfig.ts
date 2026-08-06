export const AUDIO_BUCKET = 'audio';
export const DOCUMENT_BUCKET = 'documents';

export const AUDIO_ACCEPT =
  'audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.webm';

export const DOCUMENT_ACCEPT =
  '.pdf,.epub,application/pdf,application/epub+zip';

export const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'm4a',
  'wav',
  'ogg',
  'aac',
  'flac',
  'webm',
]);

export const DOCUMENT_EXTENSIONS = new Set(['pdf', 'epub']);
