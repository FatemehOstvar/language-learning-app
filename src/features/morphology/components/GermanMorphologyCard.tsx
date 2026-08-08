import { ExternalLink, Loader2, Sigma } from 'lucide-react';
import {
  translateGermanMorphologyFeature,
  type GermanMorphologyResult,
} from '@/features/morphology/api/germanMorphology';

interface GermanMorphologyCardProps {
  loading: boolean;
  result: GermanMorphologyResult | null;
  error: string | null;
  displayLanguage: string;
}

function translateAnalysisLabel(label: string, displayLanguage: string): string {
  if (displayLanguage !== 'en') return label;

  return label
    .replace(/^Deklinierte Form$/i, 'Declined form')
    .replace(/^Konjugierte Form$/i, 'Conjugated form')
    .replace(/^Partizip II$/i, 'Past participle')
    .replace(/^Partizip I$/i, 'Present participle')
    .replace(/^Komparativ$/i, 'Comparative')
    .replace(/^Superlativ$/i, 'Superlative');
}

export default function GermanMorphologyCard({
  loading,
  result,
  error,
  displayLanguage,
}: GermanMorphologyCardProps) {
  const hasMorphology = Boolean(
    result &&
      (result.partOfSpeech || result.details.length > 0 || result.analyses.length > 0),
  );

  return (
    <section
      aria-label="Morphology"
      className="mb-2 rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-2"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
          <Sigma className="h-3 w-3" />
          Morphology
        </span>

        {result?.sourceUrl && (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-violet-700"
          >
            Wiktionary
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          
        </div>
      )}

      {!loading && error && (
        <p className="text-xs leading-4 text-slate-500">
          —
        </p>
      )}

      {!loading && !error && result && !hasMorphology && (
        <p className="text-xs leading-4 text-slate-500">
          —
        </p>
      )}

      {!loading && !error && result?.partOfSpeech && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
              {result.partOfSpeech}
            </span>
          </div>

          {result.details.length > 0 && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-xs leading-4">
              {result.details.map((detail) => (
                <div key={`${detail.label}:${detail.value}`} className="contents">
                  <dt className="font-semibold text-slate-500">{detail.label}</dt>
                  <dd className="text-slate-800">{detail.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {!loading && !error && result && result.analyses.length > 0 && (
        <div className="space-y-2">
          {result.analyses.slice(0, 3).map((analysis, analysisIndex) => (
            <div
              key={`${analysis.label}:${analysisIndex}`}
              className="rounded-md border border-violet-100 bg-white/70 px-2 py-1.5"
            >
              <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-violet-800">
                  {translateAnalysisLabel(analysis.label, displayLanguage)}
                </span>
                {analysis.lemma && (
                  <span className="text-slate-500">
                    lemma <strong className="text-slate-700">{analysis.lemma}</strong>
                  </span>
                )}
              </div>

              <ul className="space-y-0.5 text-xs leading-4 text-slate-700">
                {analysis.features.slice(0, 5).map((feature) => (
                  <li key={feature}>
                    {translateGermanMorphologyFeature(feature, displayLanguage)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
