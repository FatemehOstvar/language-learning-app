import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function useAudioPlayback(resetKey: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [resetKey]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const mediaDuration = Number.isFinite(audio.duration)
        ? audio.duration
        : duration;
      const nextTime = clamp(seconds, 0, mediaDuration || 0);

      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration],
  );

  const skip = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (audio) seek(audio.currentTime + seconds);
    },
    [seek],
  );

  const handleTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      setCurrentTime(event.currentTarget.currentTime);
    },
    [],
  );

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLAudioElement>) => {
      const nextDuration = event.currentTarget.duration;
      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
    },
    [],
  );

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    skip,
    seek,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlay: () => setIsPlaying(true),
    handlePause: () => setIsPlaying(false),
    handleEnded: () => setIsPlaying(false),
  };
}
