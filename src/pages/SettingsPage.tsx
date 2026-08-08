import LanguageSettingsPanel from '@/features/settings/components/LanguageSettingsPanel';
import TutorialSettingsPanel from '@/features/settings/components/TutorialSettingsPanel';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">Settings</h1>
      <div className="space-y-3">
        <LanguageSettingsPanel />
        <TutorialSettingsPanel />
      </div>
    </div>
  );
}
