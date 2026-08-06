import { DocumentLessonHeader } from '@/features/player/components/DocumentLessonHeader';
import { DocumentViewer } from '@/features/player/components/DocumentViewer';
import type { PlayerLessonProps } from '@/features/player/model/types';

export function DocumentLesson({ media, focusMode }: PlayerLessonProps) {
  return (
    <div
      className={
        focusMode
          ? 'min-h-screen bg-white'
          : 'min-h-[calc(100vh-4rem)] bg-slate-50'
      }
    >
      <div
        className={
          focusMode ? 'h-screen' : 'mx-auto max-w-7xl px-4 py-6 sm:px-6'
        }
      >
        {!focusMode && (
          <DocumentLessonHeader
            media={media}
            description="Read the lesson document below."
          />
        )}

        <DocumentViewer
          media={media}
          className={
            focusMode
              ? 'h-screen min-h-0 rounded-none border-0 shadow-none'
              : 'h-[calc(100vh-12rem)] min-h-[600px]'
          }
        />
      </div>
    </div>
  );
}
