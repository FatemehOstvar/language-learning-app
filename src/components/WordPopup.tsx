import { useEffect, useRef, useState } from 'react';
import { Check, X, BookPlus, Loader2 } from 'lucide-react';
import { normalizeWord, upsertWord, type WordStatus } from '@/lib/leitner';

interface WordPopupProps {
  word: string;
  sentence: string;
  x: number;
  y: number;
  onClose: () => void;
  onSaved: (word: string, status: WordStatus) => void;
}

export default function WordPopup({ word, sentence, x, y, onClose, onSaved }: WordPopupProps) {
  const [saving, setSaving] = useState<WordStatus | null>(null);
  const [saved, setSaved] = useState<WordStatus | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const cleanWord = normalizeWord(word);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = async (status: WordStatus) => {
    setSaving(status);
    try {
      await upsertWord(word, sentence, status);
      setSaved(status);
      onSaved(cleanWord, status);
      setTimeout(() => onClose(), 800);
    } catch {
      setSaving(null);
    }
  };

  // Adjust position to keep popup on screen
  const popupWidth = 280;
  const popupHeight = 200;
  const adjustedX = Math.min(x, window.innerWidth - popupWidth - 16);
  const adjustedY = Math.min(y, window.innerHeight - popupHeight - 16);

  const options: { status: WordStatus; label: string; icon: typeof Check; color: string }[] = [
    { status: 'leitner', label: 'Yes, add to Leitner', icon: BookPlus, color: 'amber' },
    { status: 'learned', label: 'I already know this', icon: Check, color: 'emerald' },
    { status: 'unlearned', label: "No, don't learn it", icon: X, color: 'slate' },
  ];

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-fade-in"
      style={{ left: adjustedX, top: adjustedY, width: popupWidth }}
    >
      <p className="text-sm font-medium text-slate-400 mb-1">Do you want to learn this?</p>
      <p className="text-lg font-bold text-slate-900 mb-3 capitalize">{cleanWord}</p>

      {saved ? (
        <div className="flex items-center gap-2 py-3 text-sm font-medium text-emerald-600">
          <Check className="w-5 h-5" />
          Saved!
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSaving = saving === opt.status;
            const colorMap: Record<string, string> = {
              amber: 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
              emerald: 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700',
              slate: 'hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600',
            };
            return (
              <button
                key={opt.status}
                onClick={() => handleAction(opt.status)}
                disabled={saving !== null}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorMap[opt.color]}`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
