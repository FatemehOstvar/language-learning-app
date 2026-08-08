import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WordPopup from '@/features/vocabulary/components/WordPopup';
import { parseSrt, type SrtCue } from '@/shared/utils/srtParser';
import { AudioTransportControls } from '@/features/player/components/AudioTransportControls';
import { MarkAllWordsLearnedButton } from '@/features/player/components/MarkAllWordsLearnedButton';
import { InteractiveTranscript } from '@/features/player/components/InteractiveTranscript';
import { useAudioPlayback } from '@/features/player/hooks/useAudioPlayback';
import { useAutoFollow } from '@/features/player/hooks/useAutoFollow';
import { usePlaybackShortcuts } from '@/features/player/hooks/usePlaybackShortcuts';
import { useVocabulary } from '@/features/player/hooks/useVocabulary';
import {
  buildSentencesFromCues,
  findActiveSentenceIndex,
} from '@/features/player/utils/transcriptUtils';
import type { PlayerLessonProps, Sentence } from '@/features/player/model/types';

export function AudioLesson({ media, focusMode }: PlayerLessonProps) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const [cues, setCues] = useState<SrtCue[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const playback = useAudioPlayback(media.id);

  const sentences = useMemo(() => buildSentencesFromCues(cues), [cues]);
  const activeIndex = useMemo(
    () => findActiveSentenceIndex(sentences, playback.currentTime),
    [playback.currentTime, sentences],
  );
  const vocabulary = useVocabulary(sentences, media.id);
  const minuteBuffer = usePlaybackShortcuts({
    onTogglePlay: playback.togglePlay,
    onSeek: playback.seek,
    onSkip: playback.skip,
  });

  useEffect(() => {
    setCues(parseSrt(media.srt_content || ''));
  }, [media.id, media.srt_content]);

  useAutoFollow({
    enabled: autoScroll,
    isPlaying: playback.isPlaying,
    activeIndex,
    activeRef,
  });

  const seekToSentence = useCallback(
    (sentence: Sentence) => {
      if (sentence.startTime === undefined) return;
      playback.seek(sentence.startTime);
      void playback.audioRef.current?.play();
    },
    [playback],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {!focusMode && (
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {media.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {media.audio_filename}
          </p>
        </header>
      )}

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
        className={`sticky z-40 mb-2 ${focusMode ? 'top-1' : 'top-16'}`}
      >
        <AudioTransportControls
          currentTime={playback.currentTime}
          duration={playback.duration}
          isPlaying={playback.isPlaying}
          disabled={!media.audio_url}
          autoScroll={autoScroll}
          onTogglePlay={playback.togglePlay}
          onSkip={playback.skip}
          onSeek={playback.seek}
          onToggleAutoScroll={() => setAutoScroll((value) => !value)}
        />
      </div>

      {minuteBuffer && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 font-mono text-sm text-white shadow-lg">
          Jumping to {minuteBuffer} min...
        </div>
      )}

      <InteractiveTranscript
        sentences={sentences}
        trackedWords={vocabulary.trackedWordMap}
        activeIndex={activeIndex}
        activeRef={activeRef}
        onSentenceClick={seekToSentence}
        onWordClick={vocabulary.openWordPopup}
      />

      <MarkAllWordsLearnedButton
        allMarked={vocabulary.allMarked}
        markingAll={vocabulary.markingAll}
        onClick={vocabulary.markAllLearned}
      />

      <div className="h-20" />

      {vocabulary.popup && (
        <WordPopup
          key={`${vocabulary.popup.word}-${vocabulary.popup.x}-${vocabulary.popup.y}`}
          {...vocabulary.popup}
          onClose={vocabulary.closePopup}
          onSaved={vocabulary.handlePopupSaved}
        />
      )}
    </div>
  );
}
