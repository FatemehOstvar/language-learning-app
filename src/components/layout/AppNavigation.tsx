import { Upload, Headphones, Library, Brain, Settings } from 'lucide-react';

export type Page = 'upload' | 'player' | 'library' | 'leitner' | 'settings';

interface NavProps {
  current: Page;
  onNavigate: (page: Page) => void;
  hasActiveMedia: boolean;
}

const navItems: { id: Page; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'Add', icon: Upload },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'player', label: 'Player', icon: Headphones },
  { id: 'leitner', label: 'Words', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AppNavigation({
  current,
  onNavigate,
  hasActiveMedia,
}: NavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
          L
        </div>

        <div className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            const disabled = item.id === 'player' && !hasActiveMedia;

            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() => !disabled && onNavigate(item.id)}
                disabled={disabled}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition sm:px-3 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : disabled
                      ? 'cursor-not-allowed text-slate-300'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
