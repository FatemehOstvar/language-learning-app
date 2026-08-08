export const AUDIO_BUCKET = 'audio';
export const DOCUMENT_BUCKET = 'documents';

export const AUDIO_ACCEPT =
  'audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.webm';

export const DOCUMENT_ACCEPT =
  '.pdf,.epub,application/pdf,application/epub+zip';

export const SUBTITLE_ACCEPT =
  '.srt,.vtt,application/x-subrip,text/vtt';

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
export const SUBTITLE_EXTENSIONS = new Set(['srt', 'vtt']);

export const TEXT_ACCEPT = '.txt,.md,.text,text/plain,text/markdown';
export const TEXT_EXTENSIONS = new Set(['txt', 'md', 'text']);
