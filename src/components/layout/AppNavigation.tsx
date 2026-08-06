import { Upload, Headphones, Library, Brain } from 'lucide-react';

export type Page = 'upload' | 'player' | 'library' | 'leitner';

interface NavProps {
  current: Page;
  onNavigate: (page: Page) => void;
  hasActiveMedia: boolean;
}

const navItems: { id: Page; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'Add', icon: Upload },
  { id: 'player', label: 'Player', icon: Headphones },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'leitner', label: 'Leitner', icon: Brain },
];

export default function AppNavigation({ current, onNavigate, hasActiveMedia }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-lg tracking-tight">LinguaLab</span>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            const disabled = item.id === 'player' && !hasActiveMedia;
            return (
              <button
                key={item.id}
                onClick={() => !disabled && onNavigate(item.id)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
