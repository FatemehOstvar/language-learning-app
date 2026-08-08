export type LanguageCode =
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'it'
  | 'fa'
  | 'ar'
  | 'ru';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  availableAsLearningLanguage: boolean;
  availableAsNativeLanguage: boolean;
}

export interface LanguagePreferences {
  learningLanguage: LanguageCode;
  nativeLanguages: LanguageCode[];
}

export const DEFAULT_LANGUAGE_PREFERENCES: LanguagePreferences = {
  learningLanguage: 'de',
  nativeLanguages: ['en'],
};

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    code: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'it',
    label: 'Italian',
    nativeLabel: 'Italiano',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'ru',
    label: 'Russian',
    nativeLabel: 'Русский',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'fa',
    label: 'Persian',
    nativeLabel: 'فارسی',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    availableAsLearningLanguage: true,
    availableAsNativeLanguage: true,
  },
];

const RTL_LANGUAGES = new Set<LanguageCode>(['ar', 'fa']);
const LANGUAGE_CODES = new Set<LanguageCode>(
  LANGUAGE_OPTIONS.map((language) => language.code),
);

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_CODES.has(value as LanguageCode);
}

export function sanitizeLanguagePreferences(
  value: Partial<LanguagePreferences> | null | undefined,
): LanguagePreferences {
  const learningLanguage = isLanguageCode(value?.learningLanguage)
    ? value.learningLanguage
    : DEFAULT_LANGUAGE_PREFERENCES.learningLanguage;

  const nativeLanguages = Array.isArray(value?.nativeLanguages)
    ? Array.from(new Set(value.nativeLanguages.filter(isLanguageCode)))
    : [];

  return {
    learningLanguage,
    nativeLanguages:
      nativeLanguages.length > 0
        ? nativeLanguages
        : [...DEFAULT_LANGUAGE_PREFERENCES.nativeLanguages],
  };
}

export function getPrimaryNativeLanguage(
  preferences: LanguagePreferences,
): LanguageCode {
  return (
    preferences.nativeLanguages[0] ||
    DEFAULT_LANGUAGE_PREFERENCES.nativeLanguages[0]
  );
}

export function getLanguageDirection(
  language: string,
): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.has(language.toLowerCase() as LanguageCode)
    ? 'rtl'
    : 'ltr';
}

export function getLanguageDisplayName(language: string): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.code === language)?.label ||
    language.toUpperCase()
  );
}
