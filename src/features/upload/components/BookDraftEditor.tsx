import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { BatchBookDraft } from '@/features/upload/model/types';

interface BookDraftEditorProps {
  book: BatchBookDraft;
  withAudio: boolean;
  disabled: boolean;
  onBookTitleChange: (value: string) => void;
  onChapterTitleChange: (chapterId: string, value: string) => void;
  onMoveChapter: (from: number, to: number) => void;
  onMoveAudio: (from: number, to: number) => void;
  onShiftAudio: (delta: number) => void;
}

function pairedAudioIndex(row: number, offset: number): number {
  return row - offset;
}

export default function BookDraftEditor({
  book,
  withAudio,
  disabled,
  onBookTitleChange,
  onChapterTitleChange,
  onMoveChapter,
  onMoveAudio,
  onShiftAudio,
}: BookDraftEditorProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <input
          aria-label="Book title"
          value={book.title}
          disabled={disabled}
          onChange={(event) => onBookTitleChange(event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50"
        />

        {withAudio && (
          <div className="flex shrink-0 items-center gap-1">
            <span className="w-7 text-center text-[11px] tabular-nums text-slate-400">
              {book.audioOffset > 0 ? `+${book.audioOffset}` : book.audioOffset}
            </span>
            <ShiftButton
              direction="earlier"
              disabled={disabled}
              onClick={() => onShiftAudio(-1)}
            />
            <ShiftButton
              direction="later"
              disabled={disabled}
              onClick={() => onShiftAudio(1)}
            />
          </div>
        )}
      </div>

      <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[600px] border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th className="w-10 px-2 py-1.5 font-medium">#</th>
              <th className="px-2 py-1.5 font-medium">Chapter</th>
              {withAudio && <th className="px-2 py-1.5 font-medium">Audio</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {book.chapters.map((chapter, index) => {
              const audioIndex = pairedAudioIndex(index, book.audioOffset);
              const audio =
                audioIndex >= 0 && audioIndex < book.audioFiles.length
                  ? book.audioFiles[audioIndex]
                  : null;

              return (
                <tr key={chapter.id}>
                  <td className="px-2 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex shrink-0 gap-0.5">
                        <MoveButton
                          direction="up"
                          disabled={disabled || index === 0}
                          onClick={() => onMoveChapter(index, index - 1)}
                        />
                        <MoveButton
                          direction="down"
                          disabled={disabled || index === book.chapters.length - 1}
                          onClick={() => onMoveChapter(index, index + 1)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          aria-label={`Chapter ${index + 1} title`}
                          value={chapter.title}
                          disabled={disabled}
                          onChange={(event) => onChapterTitleChange(chapter.id, event.target.value)}
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-800 outline-none focus:border-slate-400 disabled:bg-slate-50"
                        />
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">{chapter.file.name}</p>
                      </div>
                    </div>
                  </td>

                  {withAudio && (
                    <td className="max-w-[260px] px-2 py-2">
                      <span className={`block truncate text-xs ${audio ? 'text-slate-600' : 'text-amber-600'}`}>
                        {audio?.name ?? '—'}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {withAudio && (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50/60 p-2">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Audio order</span>
            <span>{book.audioFiles.length}</span>
          </div>
          {book.audioFiles.length > 0 ? (
            <ol className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
              {book.audioFiles.map((audioFile, index) => (
                <li
                  key={`${audioFile.name}-${audioFile.size}-${audioFile.lastModified}-${index}`}
                  className="flex items-center gap-1.5 px-2 py-1.5"
                >
                  <span className="w-5 shrink-0 text-right text-[10px] tabular-nums text-slate-400">{index + 1}</span>
                  <div className="flex shrink-0 gap-0.5">
                    <MoveButton
                      direction="up"
                      disabled={disabled || index === 0}
                      onClick={() => onMoveAudio(index, index - 1)}
                    />
                    <MoveButton
                      direction="down"
                      disabled={disabled || index === book.audioFiles.length - 1}
                      onClick={() => onMoveAudio(index, index + 1)}
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600">{audioFile.name}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[11px] text-amber-600">No audio</p>
          )}
        </div>
      )}
    </section>
  );
}

function ShiftButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'earlier' | 'later';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'earlier' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={`Shift audio ${direction}`}
      aria-label={`Shift audio ${direction}`}
      className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}

function MoveButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'up' | 'down';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'up' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Move ${direction}`}
      className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}
