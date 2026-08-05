import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Check,
  X,
  BookPlus,
  Loader2,
} from 'lucide-react';
import {
  normalizeWord,
  upsertWord,
  type WordStatus,
} from '@/lib/leitner';

interface WordPopupProps {
  word: string;
  sentence: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaved: (
    word: string,
    status: WordStatus,
  ) => void;
}

interface PopupPosition {
  left: number;
  top: number;
  ready: boolean;
}

const VIEWPORT_GAP = 16;
const ANCHOR_GAP = 8;
const POPUP_WIDTH = 280;

export default function WordPopup({
  word,
  sentence,
  x,
  y,
  onClose,
  onSaved,
}: WordPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef =
    useRef<number | null>(null);

  const [saving, setSaving] =
    useState<WordStatus | null>(null);
  const [saved, setSaved] =
    useState<WordStatus | null>(null);

  const [position, setPosition] =
    useState<PopupPosition>({
      left: 0,
      top: 0,
      ready: false,
    });

  const cleanWord = normalizeWord(word);

  const updatePosition = useCallback(() => {
    const popup = popupRef.current;

    if (!popup) {
      return;
    }

    const {
      width: popupWidth,
      height: popupHeight,
    } = popup.getBoundingClientRect();

    const maximumLeft = Math.max(
      VIEWPORT_GAP,
      window.innerWidth -
        popupWidth -
        VIEWPORT_GAP,
    );

    const maximumTop = Math.max(
      VIEWPORT_GAP,
      window.innerHeight -
        popupHeight -
        VIEWPORT_GAP,
    );

    const left = Math.min(
      Math.max(x, VIEWPORT_GAP),
      maximumLeft,
    );

    const availableSpaceBelow =
      window.innerHeight - y - VIEWPORT_GAP;

    const shouldOpenAbove =
      availableSpaceBelow < popupHeight;

    const preferredTop = shouldOpenAbove
      ? y - popupHeight - ANCHOR_GAP
      : y;

    const top = Math.min(
      Math.max(preferredTop, VIEWPORT_GAP),
      maximumTop,
    );

    setPosition({
      left,
      top,
      ready: true,
    });
  }, [x, y]);

  /*
   * Measure and position the popup before the browser paints it.
   * This prevents the initial visible jump.
   */
  useLayoutEffect(() => {
    setPosition((current) => ({
      ...current,
      ready: false,
    }));

    updatePosition();
  }, [updatePosition, saved]);

  /*
   * Keep the popup inside the viewport if the window changes size.
   */
  useEffect(() => {
    const handleViewportChange = () => {
      updatePosition();
    };

    window.addEventListener(
      'resize',
      handleViewportChange,
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleViewportChange,
      );
    };
  }, [updatePosition]);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      const popup = popupRef.current;

      if (
        popup &&
        !popup.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );

      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(
          closeTimeoutRef.current,
        );
      }
    };
  }, []);

  const handleAction = async (
    status: WordStatus,
  ) => {
    if (saving !== null) {
      return;
    }

    setSaving(status);

    try {
      await upsertWord(
        word,
        sentence,
        status,
      );

      setSaved(status);
      onSaved(cleanWord, status);

      closeTimeoutRef.current =
        window.setTimeout(() => {
          onClose();
        }, 800);
    } catch (error) {
      console.error(
        'Failed to save word:',
        error,
      );

      setSaving(null);
    }
  };

  const options: {
    status: WordStatus;
    label: string;
    icon: typeof Check;
    className: string;
  }[] = [
    {
      status: 'leitner',
      label: 'Add to Leitner',
      icon: BookPlus,
      className:
        'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    },
    {
      status: 'learned',
      label: 'I already know this',
      icon: Check,
      className:
        'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
    },
    {
      status: 'unlearned',
      label: "Don't learn this word",
      icon: X,
      className:
        'hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600',
    },
  ];

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="false"
      aria-label={`Learning options for ${cleanWord}`}
      className={`
        fixed z-50 rounded-2xl border border-slate-200
        bg-white p-4 shadow-xl
        transition-opacity duration-100
        ${
          position.ready
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }
      `}
      style={{
        left: position.left,
        top: position.top,
        width: `min(${POPUP_WIDTH}px, calc(100vw - ${
          VIEWPORT_GAP * 2
        }px))`,
        visibility: position.ready
          ? 'visible'
          : 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close popup"
        className="
          absolute right-3 top-3 rounded-lg p-1
          text-slate-400 transition-colors
          hover:bg-slate-100 hover:text-slate-700
        "
      >
        <X className="h-4 w-4" />
      </button>

      <p className="mb-1 pr-7 text-sm font-medium text-slate-400">
        Do you want to learn this word?
      </p>

      <p className="mb-3 text-lg font-bold capitalize text-slate-900">
        {cleanWord}
      </p>

      {saved ? (
        <div className="flex items-center gap-2 py-3 text-sm font-medium text-emerald-600">
          <Check className="h-5 w-5" />
          Saved
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isSaving =
              saving === option.status;

            return (
              <button
                key={option.status}
                type="button"
                onClick={() =>
                  void handleAction(
                    option.status,
                  )
                }
                disabled={saving !== null}
                className={`
                  flex w-full items-center gap-2.5
                  rounded-xl border border-slate-200
                  px-3 py-2.5 text-left text-sm
                  font-medium text-slate-700
                  transition-colors
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  ${option.className}
                `}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}

                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}