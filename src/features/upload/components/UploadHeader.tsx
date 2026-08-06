import { Layers3 } from 'lucide-react';

export default function UploadHeader() {
  return (
    <header className="mb-10 max-w-2xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <Layers3 className="h-3.5 w-3.5" />
        Lesson builder
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Create a new lesson
      </h1>

      <p className="mt-3 text-base leading-7 text-slate-500">
        Combine audio with a PDF or EPUB, upload a standalone document, or
        create a lesson from pasted text.
      </p>
    </header>
  );
}
