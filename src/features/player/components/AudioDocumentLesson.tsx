import { AudioTransportControls } from '@/features/player/components/AudioTransportControls';
import { DocumentLessonHeader } from '@/features/player/components/DocumentLessonHeader';
import { DocumentStudyLesson } from '@/features/player/components/DocumentStudyLesson';
import { useAudioPlayback } from '@/features/player/hooks/useAudioPlayback';
import type { PlayerLessonProps } from '@/features/player/model/types';

export function AudioDocumentLesson({
  media,
  focusMode,
}: PlayerLessonProps) {
  const playback = useAudioPlayback(media.id);

  return (
    <div
      className={
        focusMode
          ? 'min-h-screen bg-white pb-[42px]'
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

      {!focusMode && (
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          <DocumentLessonHeader
            media={media}
            description="Listen to the audio while studying the companion document."
          />
        </div>
      )}

      <DocumentStudyLesson
        media={media}
        focusMode
        controlsBottomClassName="bottom-14"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-1 py-[3px]">
          <AudioTransportControls
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
