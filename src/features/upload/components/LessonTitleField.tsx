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
        className="mb-1.5 block text-sm font-medium text-slate-800"
      >
        Title
      </label>

      <input
        id="lesson-title"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="French listening practice"
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}
