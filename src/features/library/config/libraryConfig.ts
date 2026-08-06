import {
  BookOpen,
  FileText,
  Headphones,
  Layers3,
  type LucideIcon,
} from 'lucide-react';
import type {
  LessonTypeFilter,
} from '@/features/library/model/types';
import type {
  MediaFile,
  MediaType,
} from '@/shared/api/supabase';

export const LESSON_TYPE_OPTIONS: Array<{
  value: LessonTypeFilter;
  label: string;
}> = [
  { value: 'all', label: 'All types' },
  { value: 'audio', label: 'Audio' },
  { value: 'audio_document', label: 'Audio + document' },
  { value: 'document', label: 'Document' },
  { value: 'text', label: 'Text' },
];

export const LESSON_TYPE_LABELS: Record<
  MediaType,
  string
> = {
  audio: 'Audio',
  audio_document: 'Audio + document',
  document: 'Document',
  text: 'Text',
};

export function getLessonIcon(
  lesson: MediaFile,
): LucideIcon {
  if (lesson.media_type === 'audio') {
    return Headphones;
  }

  if (lesson.media_type === 'audio_document') {
    return Layers3;
  }

  if (lesson.media_type === 'document') {
    return BookOpen;
  }

  return FileText;
}
