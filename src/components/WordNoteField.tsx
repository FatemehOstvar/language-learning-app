import { StickyNote } from 'lucide-react';

const MAX_NOTE_LENGTH = 1000;

interface WordNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function WordNoteField({
  value,
  onChange,
}: WordNoteFieldProps) {
  return (
    <div>
      <label
        htmlFor="leitner-note"
        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
      >
        <StickyNote className="h-3.5 w-3.5 text-slate-400" />
        Note
        <span className="font-normal text-slate-400">(optional)</span>
      </label>

      <textarea
        id="leitner-note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Meaning, translation, grammar hint, mnemonic…"
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        autoFocus
        className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />

      <p className="mt-1 text-right text-[10px] text-slate-400">
        {value.length}/{MAX_NOTE_LENGTH}
      </p>
    </div>
  );
}
