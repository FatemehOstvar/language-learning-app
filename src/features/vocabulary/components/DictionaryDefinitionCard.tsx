import { ExternalLink, Loader2 } from 'lucide-react';
import type { DictionaryLookupResult } from '@/features/vocabulary/api/dictionary';

interface DictionaryDefinitionCardProps {
  loading: boolean;
  result: DictionaryLookupResult | null;
  error: string | null;
  sourceLanguage: string;
  definitionLanguage: string;
  direction: 'ltr' | 'rtl';
}

export default function DictionaryDefinitionCard({
  loading,
  result,
  error,
  direction,
}: DictionaryDefinitionCardProps) {
  return (
    <section
      aria-label="Meaning"
      dir={direction}
      className="mb-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Meaning</span>
        {result?.sourceUrl && (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noreferrer"
            title="Wiktionary"
            aria-label="Wiktionary"
            className="text-slate-400 hover:text-slate-700"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {loading && (
        <div className="py-1 text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </div>
      )}

      {!loading && (error || result?.definitions.length === 0) && (
        <p className="text-xs text-slate-400">—</p>
      )}

      {!loading && result && result.definitions.length > 0 && (
        <ol className="space-y-1 text-xs leading-4 text-slate-800">
          {result.definitions.map((definition, index) => (
            <li key={`${definition.partOfSpeech || 'definition'}-${index}`}>
              {definition.partOfSpeech && (
                <span className="mr-1 font-medium italic text-slate-400">{definition.partOfSpeech}</span>
              )}
              {definition.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
