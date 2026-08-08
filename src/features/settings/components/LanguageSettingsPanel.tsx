import { RotateCcw } from 'lucide-react';
import { useLanguagePreferences } from '@/features/settings/context/LanguagePreferencesContext';
import {
  LANGUAGE_OPTIONS,
  getLanguageDirection,
  type LanguageCode,
} from '@/features/vocabulary/config/languageConfig';

const learningLanguages = LANGUAGE_OPTIONS.filter(
  (language) => language.availableAsLearningLanguage,
);
const nativeLanguages = LANGUAGE_OPTIONS.filter(
  (language) => language.availableAsNativeLanguage,
);

export default function LanguageSettingsPanel() {
  const {
    preferences,
    primaryNativeLanguage,
    setLearningLanguage,
    setPrimaryNativeLanguage,
    toggleNativeLanguage,
    resetLanguagePreferences,
  } = useLanguagePreferences();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Languages</h2>
        <button
          type="button"
          onClick={resetLanguagePreferences}
          title="Reset"
          aria-label="Reset languages"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-400">Learning</span>
          <select
            value={preferences.learningLanguage}
            onChange={(event) => setLearningLanguage(event.target.value as LanguageCode)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
          >
            {learningLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeLabel}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-400">Native</span>
          <select
            value={primaryNativeLanguage}
            dir={getLanguageDirection(primaryNativeLanguage)}
            onChange={(event) => setPrimaryNativeLanguage(event.target.value as LanguageCode)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
          >
            {nativeLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeLabel}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {nativeLanguages.map((language) => {
          const selected = preferences.nativeLanguages.includes(language.code);
          const primary = language.code === primaryNativeLanguage;
          return (
            <button
              key={language.code}
              type="button"
              disabled={primary}
              onClick={() => toggleNativeLanguage(language.code)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                selected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-50'
              } ${primary ? 'cursor-default ring-1 ring-emerald-200' : ''}`}
            >
              {language.nativeLabel}
            </button>
          );
        })}
      </div>

      {preferences.learningLanguage === 'de' && (
        <p className="mt-3 text-[11px] text-emerald-700">German morphology on</p>
      )}
      {primaryNativeLanguage !== 'en' && (
        <p className="mt-1 text-[11px] text-slate-400">Dictionary meanings: English</p>
      )}
    </section>
  );
}
