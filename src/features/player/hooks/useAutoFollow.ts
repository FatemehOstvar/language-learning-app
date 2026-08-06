import {
  useEffect,
  useRef,
  type RefObject,
} from 'react';

interface AutoFollowOptions {
  enabled: boolean;
  isPlaying: boolean;
  activeIndex: number;
  activeRef: RefObject<HTMLSpanElement>;
}

type ScrollContainer =
  | Window
  | HTMLElement;

const TUNING = {
  // Slow, almost constant movement in the normal reading zone.
  baseSpeed: 7.5,

  // Maximum speed when the active sentence has fallen far behind.
  catchUpSpeed: 22,

  // Long response time prevents visible speed jumps.
  responseMilliseconds: 1800,

  // Hard acceleration limit, measured in pixels per second squared.
  maxAcceleration: 9,

  // Active-sentence center positions as ratios of the visible area.
  stopUntilRatio: 0.18,
  baseSpeedRatio: 0.34,
  catchUpStartsRatio: 0.58,
  fullCatchUpRatio: 0.86,
} as const;

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function smoothStep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function findScrollContainer(
  element: HTMLElement,
): ScrollContainer {
  let parent = element.parentElement;

  while (parent) {
    const style =
      window.getComputedStyle(parent);

    const scrollable =
      /(auto|scroll|overlay)/.test(
        style.overflowY,
      );

    if (
      scrollable &&
      parent.scrollHeight >
        parent.clientHeight
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return window;
}

function getViewport(
  container: ScrollContainer,
) {
  if (container === window) {
    return {
      top: 0,
      height: window.innerHeight,
    };
  }

  const element =
    container as HTMLElement;

  const rect =
    element.getBoundingClientRect();

  return {
    top: rect.top,
    height: element.clientHeight,
  };
}

function scrollByDistance(
  container: ScrollContainer,
  distance: number,
) {
  if (container === window) {
    window.scrollTo(
      window.scrollX,
      window.scrollY + distance,
    );
    return;
  }

  const element =
    container as HTMLElement;

  element.scrollTop += distance;
}

function getTargetSpeed(
  sentence: HTMLElement,
  container: ScrollContainer,
): number {
  const viewport =
    getViewport(container);

  if (viewport.height <= 0) {
    return 0;
  }

  const rect =
    sentence.getBoundingClientRect();

  const sentenceCenter =
    rect.top +
    rect.height / 2 -
    viewport.top;

  const positionRatio =
    sentenceCenter / viewport.height;

  if (
    positionRatio <=
    TUNING.stopUntilRatio
  ) {
    return 0;
  }

  if (
    positionRatio <
    TUNING.baseSpeedRatio
  ) {
    const progress =
      (
        positionRatio -
        TUNING.stopUntilRatio
      ) /
      (
        TUNING.baseSpeedRatio -
        TUNING.stopUntilRatio
      );

    return (
      TUNING.baseSpeed *
      smoothStep(progress)
    );
  }

  if (
    positionRatio <=
    TUNING.catchUpStartsRatio
  ) {
    return TUNING.baseSpeed;
  }

  const catchUpProgress =
    (
      positionRatio -
      TUNING.catchUpStartsRatio
    ) /
    (
      TUNING.fullCatchUpRatio -
      TUNING.catchUpStartsRatio
    );

  return (
    TUNING.baseSpeed +
    (
      TUNING.catchUpSpeed -
      TUNING.baseSpeed
    ) *
      smoothStep(catchUpProgress)
  );
}

export function useAutoFollow({
  enabled,
  isPlaying,
  activeIndex,
  activeRef,
}: AutoFollowOptions) {
  const activeIndexRef =
    useRef(activeIndex);

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    if (!enabled || !isPlaying) {
      return;
    }

    const reducedMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

    if (reducedMotion) {
      return;
    }

    let frameId: number | null = null;
    let previousTime =
      performance.now();

    // Keep velocity alive when the active sentence changes.
    // The previous version restarted this at every new sentence,
    // which caused the repeated abrupt feeling.
    let currentSpeed = 0;

    let lastSentence:
      | HTMLSpanElement
      | null = null;

    let scrollContainer:
      | ScrollContainer
      | null = null;

    const tick = (time: number) => {
      // requestAnimationFrame already runs once per display frame,
      // normally every 8–16 ms. Cap delayed frames so a lag spike
      // can never produce one large scroll movement.
      const deltaSeconds =
        Math.min(
          Math.max(
            (time - previousTime) / 1000,
            0,
          ),
          1 / 60,
        );

      previousTime = time;

      const sentence =
        activeRef.current;

      if (
        sentence &&
        activeIndexRef.current >= 0
      ) {
        if (sentence !== lastSentence) {
          lastSentence = sentence;
          scrollContainer =
            findScrollContainer(sentence);
        }

        const targetSpeed =
          scrollContainer
            ? getTargetSpeed(
                sentence,
                scrollContainer,
              )
            : 0;

        const response =
          1 -
          Math.exp(
            -(
              deltaSeconds *
              1000
            ) /
              TUNING.responseMilliseconds,
          );

        const smoothedSpeed =
          currentSpeed +
          (
            targetSpeed -
            currentSpeed
          ) *
            response;

        const maximumChange =
          TUNING.maxAcceleration *
          deltaSeconds;

        currentSpeed += clamp(
          smoothedSpeed -
            currentSpeed,
          -maximumChange,
          maximumChange,
        );

        if (
          scrollContainer &&
          currentSpeed > 0.001
        ) {
          scrollByDistance(
            scrollContainer,
            currentSpeed *
              deltaSeconds,
          );
        }
      } else {
        currentSpeed = 0;
        lastSentence = null;
        scrollContainer = null;
      }

      frameId =
        window.requestAnimationFrame(
          tick,
        );
    };

    frameId =
      window.requestAnimationFrame(
        tick,
      );

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId,
        );
      }
    };
  }, [
    activeRef,
    enabled,
    isPlaying,
  ]);
}
