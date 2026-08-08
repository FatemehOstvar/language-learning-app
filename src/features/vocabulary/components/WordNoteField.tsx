import { forwardRef, type ChangeEvent } from 'react';

const MAX_NOTE_LENGTH = 1000;

interface WordNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const WordNoteField = forwardRef<HTMLTextAreaElement, WordNoteFieldProps>(
  function WordNoteField({ value, onChange }, ref) {
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    };

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <textarea
          ref={ref}
          id="leitner-note"
          value={value}
          onChange={handleChange}
          placeholder="Note…"
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          aria-label="Note"
          className="min-h-20 w-full flex-1 resize-none border-0 bg-transparent p-1 text-xs leading-4 text-slate-900 outline-none placeholder:text-slate-400"
        />
        <div className="px-1 pt-1 text-right text-[10px] text-slate-300">
          {value.length}/{MAX_NOTE_LENGTH}
        </div>
      </div>
    );
  },
);

export default WordNoteField;
