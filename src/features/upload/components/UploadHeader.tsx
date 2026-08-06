export default function UploadHeader() {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
        New lesson
      </p>

      <div className="mt-2 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Add study material
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Upload audio with a document or subtitles, upload a document, or
          paste text. You can start studying as soon as the lesson is saved.
        </p>
      </div>
    </header>
  );
}
