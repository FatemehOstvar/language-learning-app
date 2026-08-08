import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

const VIEWPORT_MARGIN = 8;
const MAX_POPUP_WIDTH = 480;
const MAX_POPUP_HEIGHT = 460;

interface ViewportMetrics {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
}

function readViewport(): ViewportMetrics {
  const visualViewport = window.visualViewport;

  if (visualViewport) {
    return {
      width: visualViewport.width,
      height: visualViewport.height,
      offsetLeft: visualViewport.offsetLeft,
      offsetTop: visualViewport.offsetTop,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    offsetLeft: 0,
    offsetTop: 0,
  };
}

export function useWordPopupPosition(
  x: number,
  y: number,
): CSSProperties {
  const [viewport, setViewport] =
    useState<ViewportMetrics>(readViewport);

  useEffect(() => {
    const update = () => setViewport(readViewport());
    const visualViewport = window.visualViewport;

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    visualViewport?.addEventListener('resize', update);
    visualViewport?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      visualViewport?.removeEventListener('resize', update);
      visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  return useMemo(() => {
    void x;
    void y;

    const availableWidth = Math.max(
      240,
      viewport.width - VIEWPORT_MARGIN * 2,
    );
    const availableHeight = Math.max(
      220,
      viewport.height - VIEWPORT_MARGIN * 2,
    );

    return {
      left: viewport.offsetLeft + viewport.width / 2,
      top: viewport.offsetTop + viewport.height / 2,
      width: Math.min(MAX_POPUP_WIDTH, availableWidth),
      maxWidth: availableWidth,
      maxHeight: Math.min(MAX_POPUP_HEIGHT, availableHeight),
      transform: 'translate(-50%, -50%)',
    };
  }, [viewport, x, y]);
}
