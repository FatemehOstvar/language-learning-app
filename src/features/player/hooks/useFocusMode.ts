import { useCallback, useEffect, useState } from 'react';

export function useFocusMode(resetKey?: string) {
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    setFocusMode(false);
  }, [resetKey]);

  useEffect(() => {
    if (!focusMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusMode(false);
    };

    window.addEventListener('keydown', exitOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', exitOnEscape);
    };
  }, [focusMode]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((current) => !current);
  }, []);

  return { focusMode, toggleFocusMode };
}
