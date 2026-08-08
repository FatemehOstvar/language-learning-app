import { RotateCcw } from 'lucide-react';
import { useTutorial } from '@/features/tutorial/context/TutorialContext';

export default function TutorialSettingsPanel() {
  const { showTutorial } = useTutorial();

  return (
    <section className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Tutorial</h2>
      <button
        type="button"
        onClick={showTutorial}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Show
      </button>
    </section>
  );
}
