import { Loader2 } from 'lucide-react';

export default function LeitnerLoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
