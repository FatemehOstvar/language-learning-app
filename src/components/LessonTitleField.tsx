interface LessonTitleFieldProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function LessonTitleField({
  value,
  disabled,
  onChange,
}: LessonTitleFieldProps) {
  return (
    <div>
      <label
        htmlFor="lesson-title"
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        Lesson title
      </label>
      <input
        id="lesson-title"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="For example: French listening practice"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
      />
    </div>
  );
}
