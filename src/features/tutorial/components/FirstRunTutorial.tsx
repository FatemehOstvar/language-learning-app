import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Languages,
  MousePointer2,
  Upload,
  X,
} from 'lucide-react';
import { useTutorial } from '@/features/tutorial/context/TutorialContext';

const steps = [
  {
    title: 'Add',
    icon: Upload,
    body: (
      <div className="space-y-2 text-sm leading-6 text-slate-600">
        <p>Text → edit draft → Accept.</p>
        <p>Book = chapter folder. Series = book folders.</p>
        <p>Audio can be reordered or shifted before Create.</p>
      </div>
    ),
  },
  {
    title: 'Player',
    icon: MousePointer2,
    body: (
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm text-slate-600">
        <kbd className="tutorial-key">Space</kbd><span>Play / pause</span>
        <span className="flex gap-1">
          <kbd className="tutorial-key"><ArrowLeft className="h-3.5 w-3.5" /></kbd>
          <kbd className="tutorial-key"><ArrowRight className="h-3.5 w-3.5" /></kbd>
        </span><span>−3s / +3s</span>
        <kbd className="tutorial-key">A · S · D</kbd><span>Word status</span>
        <kbd className="tutorial-key">C</kbd><span>Close popup</span>
        <kbd className="tutorial-key">F</kbd><span>Auto scroll</span>
        <span className="col-span-2 mt-1 text-xs text-slate-400">Press a word: copy + dictionary + morphology.</span>
      </div>
    ),
  },
  {
    title: 'Language',
    icon: Languages,
    body: (
      <div className="space-y-2 text-sm leading-6 text-slate-600">
        <p>Choose learning and native languages in Settings.</p>
        <p>German enables morphology. Meanings are currently English.</p>
      </div>
    ),
  },
] as const;

export default function FirstRunTutorial() {
  const { open, completeTutorial } = useTutorial();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        completeTutorial();
      } else if (event.key === 'ArrowRight' && stepIndex < steps.length - 1) {
        event.preventDefault();
        setStepIndex((current) => current + 1);
      } else if (event.key === 'ArrowLeft' && stepIndex > 0) {
        event.preventDefault();
        setStepIndex((current) => current - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completeTutorial, open, stepIndex]);

  if (!open) return null;

  const step = steps[stepIndex];
  const StepIcon = step.icon;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-tutorial-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <StepIcon className="h-4 w-4 text-emerald-600" />
            <h2 id="first-run-tutorial-title" className="text-base font-semibold text-slate-900">
              {step.title}
            </h2>
            <span className="text-[11px] text-slate-400">{stepIndex + 1}/{steps.length}</span>
          </div>
          <button
            type="button"
            onClick={completeTutorial}
            aria-label="Dismiss tutorial"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4">{step.body}</div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={completeTutorial} className="text-xs text-slate-400 hover:text-slate-700">
            Skip
          </button>
          <div className="flex items-center gap-1.5">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((current) => current - 1)}
                aria-label="Back"
                className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) completeTutorial();
                else setStepIndex((current) => current + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              {isLast ? <><Check className="h-3.5 w-3.5" /> Done</> : <>Next <ChevronRight className="h-3.5 w-3.5" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
