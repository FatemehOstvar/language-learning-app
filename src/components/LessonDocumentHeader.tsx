import { BookOpen, ExternalLink } from 'lucide-react';
import type { MediaFile } from '@/lib/supabase';

interface LessonDocumentHeaderProps {
  media: MediaFile;
  description: string;
}

export function LessonDocumentHeader({
  media,
  description,
}: LessonDocumentHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <BookOpen className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950">
            {media.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          {media.document_filename && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {media.document_filename}
            </p>
          )}
        </div>
      </div>

      {media.document_url && (
        <a
          href={media.document_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open original
        </a>
      )}
    </header>
  );
}
