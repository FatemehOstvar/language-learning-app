import { CompactAudioControls } from '@/components/CompactAudioControls';
import { LessonDocumentHeader } from '@/components/LessonDocumentHeader';
import { DocumentViewer } from '@/components/DocumentViewer';
import { useAudioPlayback } from '@/lib/useAudioPlayback';
import type { PlayerLessonProps } from '@/lib/playerTypes';

export function AudioDocumentLesson({
  media,
  focusMode,
}: PlayerLessonProps) {
  const playback = useAudioPlayback(media.id);

  return (
    <div
      className={
        focusMode
          ? 'min-h-screen bg-white pb-[38px]'
          : 'min-h-screen bg-slate-50 pb-[42px]'
      }
    >
      <audio
        ref={playback.audioRef}
        src={media.audio_url || undefined}
        onTimeUpdate={playback.handleTimeUpdate}
        onLoadedMetadata={playback.handleLoadedMetadata}
        onPlay={playback.handlePlay}
        onPause={playback.handlePause}
        onEnded={playback.handleEnded}
        className="hidden"
      />

      <div
        className={
          focusMode
            ? 'h-[calc(100vh-38px)]'
            : 'mx-auto max-w-7xl px-4 py-6 sm:px-6'
        }
      >
        {!focusMode && (
          <LessonDocumentHeader
            media={media}
            description="Listen to the audio while following the companion document."
          />
        )}

        <DocumentViewer
          media={media}
          className={
            focusMode
              ? 'h-full min-h-0 rounded-none border-0 shadow-none'
              : 'h-[calc(100vh-13rem)] min-h-[580px]'
          }
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-1 py-[3px]">
          <CompactAudioControls
            currentTime={playback.currentTime}
            duration={playback.duration}
            isPlaying={playback.isPlaying}
            disabled={!media.audio_url}
            onTogglePlay={playback.togglePlay}
            onSkip={playback.skip}
            onSeek={playback.seek}
            className="border-0 bg-transparent shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
