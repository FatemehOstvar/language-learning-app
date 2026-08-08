interface LessonTitleFieldProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function LessonTitleField({ value, disabled, onChange }: LessonTitleFieldProps) {
  return (
    <input
      aria-label="Title"
      type="text"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Title"
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-50"
    />
  );
}
