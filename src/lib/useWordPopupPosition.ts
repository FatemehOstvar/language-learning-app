import { useMemo, type CSSProperties } from 'react';

const POPUP_WIDTH = 340;
const POPUP_ESTIMATED_HEIGHT = 420;
const VIEWPORT_MARGIN = 12;

export function useWordPopupPosition(
  x: number,
  y: number,
): CSSProperties {
  return useMemo(() => {
    const maxLeft = window.innerWidth - POPUP_WIDTH - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - POPUP_ESTIMATED_HEIGHT;

    return {
      left: Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft)),
      top: Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop)),
      width: POPUP_WIDTH,
    };
  }, [x, y]);
}
