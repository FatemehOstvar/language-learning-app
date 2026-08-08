import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LANGUAGE_PREFERENCES,
  getPrimaryNativeLanguage,
  sanitizeLanguagePreferences,
  type LanguageCode,
  type LanguagePreferences,
} from '@/features/vocabulary/config/languageConfig';

const STORAGE_KEY = 'lingualab.language-preferences.v1';

interface LanguagePreferencesContextValue {
  preferences: LanguagePreferences;
  primaryNativeLanguage: LanguageCode;
  setLearningLanguage: (language: LanguageCode) => void;
  setPrimaryNativeLanguage: (language: LanguageCode) => void;
  toggleNativeLanguage: (language: LanguageCode) => void;
  resetLanguagePreferences: () => void;
}

const LanguagePreferencesContext =
  createContext<LanguagePreferencesContextValue | null>(null);

function readStoredPreferences(): LanguagePreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LANGUAGE_PREFERENCES;

    return sanitizeLanguagePreferences(
      JSON.parse(raw) as Partial<LanguagePreferences>,
    );
  } catch {
    return DEFAULT_LANGUAGE_PREFERENCES;
  }
}

export function LanguagePreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<LanguagePreferences>(
    readStoredPreferences,
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setLearningLanguage = useCallback((language: LanguageCode) => {
    setPreferences((current) => ({
      ...current,
      learningLanguage: language,
    }));
  }, []);

  const setPrimaryNativeLanguage = useCallback((language: LanguageCode) => {
    setPreferences((current) => ({
      ...current,
      nativeLanguages: [
        language,
        ...current.nativeLanguages.filter((item) => item !== language),
      ],
    }));
  }, []);

  const toggleNativeLanguage = useCallback((language: LanguageCode) => {
    setPreferences((current) => {
      const primary = getPrimaryNativeLanguage(current);

      if (language === primary) {
        return current;
      }

      const hasLanguage = current.nativeLanguages.includes(language);

      return {
        ...current,
        nativeLanguages: hasLanguage
          ? current.nativeLanguages.filter((item) => item !== language)
          : [...current.nativeLanguages, language],
      };
    });
  }, []);

  const resetLanguagePreferences = useCallback(() => {
    setPreferences({
      learningLanguage: DEFAULT_LANGUAGE_PREFERENCES.learningLanguage,
      nativeLanguages: [...DEFAULT_LANGUAGE_PREFERENCES.nativeLanguages],
    });
  }, []);

  const value = useMemo<LanguagePreferencesContextValue>(
    () => ({
      preferences,
      primaryNativeLanguage: getPrimaryNativeLanguage(preferences),
      setLearningLanguage,
      setPrimaryNativeLanguage,
      toggleNativeLanguage,
      resetLanguagePreferences,
    }),
    [
      preferences,
      resetLanguagePreferences,
      setLearningLanguage,
      setPrimaryNativeLanguage,
      toggleNativeLanguage,
    ],
  );

  return (
    <LanguagePreferencesContext.Provider value={value}>
      {children}
    </LanguagePreferencesContext.Provider>
  );
}

export function useLanguagePreferences(): LanguagePreferencesContextValue {
  const value = useContext(LanguagePreferencesContext);

  if (!value) {
    throw new Error(
      'useLanguagePreferences must be used inside LanguagePreferencesProvider.',
    );
  }

  return value;
}
