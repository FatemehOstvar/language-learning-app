import { useEffect, type RefObject } from 'react';

interface AutoFollowOptions {
  enabled: boolean;
  activeIndex: number;
  activeRef: RefObject<HTMLSpanElement>;
}

export function useAutoFollow({
  enabled,
  activeIndex,
  activeRef,
}: AutoFollowOptions) {
  useEffect(() => {
    if (!enabled || activeIndex < 0) return;

    const activeSentence = activeRef.current;
    if (!activeSentence) return;

    const frameId = window.requestAnimationFrame(() => {
      const rect = activeSentence.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const comfortTop = Math.max(96, viewportHeight * 0.24);
      const comfortBottom = viewportHeight * 0.62;

      const isComfortablyVisible =
        rect.top >= comfortTop && rect.bottom <= comfortBottom;

      if (isComfortablyVisible) return;

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      activeSentence.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeIndex, activeRef, enabled]);
}
