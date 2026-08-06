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
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-800">
            Lesson text
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Paste or write the text you want to study.
          </p>
        </div>

        <span className="shrink-0 text-xs tabular-nums text-slate-400">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your lesson text here…"
        rows={12}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
      />
    </section>
  );
}
