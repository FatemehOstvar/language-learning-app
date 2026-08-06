import { LEITNER_COPY } from '@/features/leitner/config/pageConfig';

export default function LeitnerHeader() {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {LEITNER_COPY.pageTitle}
      </h1>

      <p className="mt-1 text-sm text-slate-400">
        {LEITNER_COPY.pageDescription}
      </p>
    </header>
  );
}
