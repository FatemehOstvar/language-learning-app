import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'lingualab.first-run-tutorial.v1';

interface TutorialContextValue {
  open: boolean;
  completeTutorial: () => void;
  showTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

function shouldShowTutorial(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'complete';
  } catch {
    return true;
  }
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(shouldShowTutorial);

  const completeTutorial = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'complete');
    } catch {
      // The tutorial can still be dismissed for this session if storage is unavailable.
    }

    setOpen(false);
  }, []);

  const showTutorial = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      open,
      completeTutorial,
      showTutorial,
    }),
    [completeTutorial, open, showTutorial],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const value = useContext(TutorialContext);

  if (!value) {
    throw new Error('useTutorial must be used inside TutorialProvider.');
  }

  return value;
}
