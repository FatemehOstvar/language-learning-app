import { useEffect, useRef, useState } from 'react';

interface PlaybackShortcutOptions {
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
}

export function usePlaybackShortcuts({
  onTogglePlay,
  onSeek,
}: PlaybackShortcutOptions) {
  const timeoutRef = useRef<number | undefined>(undefined);
  const [minuteBuffer, setMinuteBuffer] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping) return;

      if (event.code === 'Space') {
        event.preventDefault();
        onTogglePlay();
        return;
      }

      if (!/^\d$/.test(event.key)) return;
      event.preventDefault();

      setMinuteBuffer((current) => {
        const next = current + event.key;

        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          onSeek(Number.parseInt(next, 10) * 60);
          setMinuteBuffer('');
        }, 800);

        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(timeoutRef.current);
    };
  }, [onSeek, onTogglePlay]);

  return minuteBuffer;
}
