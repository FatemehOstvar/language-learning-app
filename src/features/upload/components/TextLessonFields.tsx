interface TextLessonFieldsProps {
  value: string;
  wordCount: number;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function TextLessonFields({
  value,
  wordCount,
  disabled,
  onChange,
}: TextLessonFieldsProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Lesson text</p>
          <p className="mt-1 text-sm text-slate-500">
            Paste or write the text students will read.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-400">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write or paste your lesson here…"
        rows={14}
        className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
      />
    </section>
  );
}
