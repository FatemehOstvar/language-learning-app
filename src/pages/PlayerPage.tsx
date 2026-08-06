import type { ReactNode } from 'react';
import type { MediaFile } from '@/shared/api/supabase';
import { FocusModeToggle } from '@/features/player/components/FocusModeToggle';
import { useFocusMode } from '@/features/player/hooks/useFocusMode';
import { AudioDocumentLesson } from '@/features/player/components/AudioDocumentLesson';
import { AudioLesson } from '@/features/player/components/AudioLesson';
import { DocumentLesson } from '@/features/player/components/DocumentLesson';
import { TextLesson } from '@/features/player/components/TextLesson';

interface PlayerPageProps {
  media: MediaFile | null;
}

export default function PlayerPage({ media }: PlayerPageProps) {
  const { focusMode, toggleFocusMode } = useFocusMode(media?.id);

  if (!media) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-slate-400">
          No media loaded. Upload a file or pick one from the library.
        </p>
      </div>
    );
  }

  let lesson: ReactNode = null;
  const lessonProps = { media, focusMode };

  switch (media.media_type) {
    case 'audio':
      lesson = <AudioLesson {...lessonProps} />;
      break;
    case 'audio_document':
      lesson = <AudioDocumentLesson {...lessonProps} />;
      break;
    case 'document':
      lesson = <DocumentLesson {...lessonProps} />;
      break;
    case 'text':
      lesson = <TextLesson {...lessonProps} />;
      break;
  }

  return (
    <div
      className={
        focusMode
          ? 'fixed inset-0 z-[9999] overflow-y-auto bg-white'
          : 'relative'
      }
    >
      <FocusModeToggle active={focusMode} onToggle={toggleFocusMode} />
      {lesson}
    </div>
  );
}
