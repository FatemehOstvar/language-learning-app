import {
  Check,
  FolderInput,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import {
  getLessonIcon,
  LESSON_TYPE_LABELS,
} from '@/features/library/config/libraryConfig';
import { parseSrt } from '@/shared/utils/srtParser';
import type {
  MediaFile,
} from '@/shared/api/supabase';

interface LessonRowProps {
  lesson: MediaFile;
  active: boolean;
  canReorder: boolean;
  onOpen: (lesson: MediaFile) => void;
  onRename: (
    id: string,
    title: string,
  ) => Promise<boolean>;
  onMove: (
    lesson: MediaFile,
  ) => void;
  onDelete: (
    lesson: MediaFile,
  ) => void;
  onReorder: (
    draggedId: string,
    targetId: string,
  ) => Promise<void>;
}

const LESSON_DRAG_TYPE =
  'application/x-lingualab-lesson';

export default function LessonRow({
  lesson,
  active,
  canReorder,
  onOpen,
  onRename,
  onMove,
  onDelete,
  onReorder,
}: LessonRowProps) {
  const Icon = getLessonIcon(lesson);

  const [editing, setEditing] =
    useState(false);
  const [title, setTitle] =
    useState(lesson.title);
  const [menuOpen, setMenuOpen] =
    useState(false);
  const [dragOver, setDragOver] =
    useState(false);

  const inputRef =
    useRef<HTMLInputElement>(null);
  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(lesson.title);
  }, [lesson.title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const close = (event: PointerEvent) => {
      if (
        !menuRef.current?.contains(
          event.target as Node,
        )
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(
      'pointerdown',
      close,
    );

    return () =>
      window.removeEventListener(
        'pointerdown',
        close,
      );
  }, [menuOpen]);

  const saveTitle = async () => {
    const saved = await onRename(
      lesson.id,
      title,
    );

    if (saved) {
      setEditing(false);
    }
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    setDragOver(false);

    if (!canReorder) {
      return;
    }

    const draggedId =
      event.dataTransfer.getData(
        LESSON_DRAG_TYPE,
      ) ||
      event.dataTransfer.getData(
        'text/plain',
      );

    if (draggedId) {
      void onReorder(
        draggedId,
        lesson.id,
      );
    }
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed =
          'move';

        event.dataTransfer.setData(
          LESSON_DRAG_TYPE,
          lesson.id,
        );

        event.dataTransfer.setData(
          'text/plain',
          lesson.id,
        );
      }}
      onDragOver={(event) => {
        if (!canReorder) {
          return;
        }

        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() =>
        setDragOver(false)
      }
      onDrop={handleDrop}
      className={`group grid min-h-16 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-b-0 sm:px-4 ${
        dragOver
          ? 'bg-emerald-50'
          : active
            ? 'bg-emerald-50/60'
            : 'bg-white hover:bg-slate-50'
      }`}
    >
      <GripVertical
        className={`h-4 w-4 shrink-0 text-slate-300 transition ${
          canReorder
            ? 'cursor-grab opacity-0 group-hover:opacity-100'
            : 'opacity-0'
        }`}
      />

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>

      <div className="min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={title}
              maxLength={160}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void saveTitle();
                }

                if (event.key === 'Escape') {
                  setTitle(lesson.title);
                  setEditing(false);
                }
              }}
              className="h-8 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
            />

            <button
              type="button"
              onClick={() =>
                void saveTitle()
              }
              aria-label="Save lesson name"
              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setTitle(lesson.title);
                setEditing(false);
              }}
              aria-label="Cancel lesson rename"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              onOpen(lesson)
            }
            className="block max-w-full text-left"
          >
            <p className="truncate text-sm font-medium text-slate-900">
              {lesson.title}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>
                {LESSON_TYPE_LABELS[
                  lesson.media_type
                ]}
              </span>

              <span aria-hidden="true">·</span>

              <span>
                {getLessonDetail(lesson)}
              </span>

              <span aria-hidden="true">·</span>

              <time
                dateTime={lesson.created_at}
              >
                {new Date(
                  lesson.created_at,
                ).toLocaleDateString()}
              </time>
            </div>
          </button>
        )}
      </div>

      {!editing && (
        <div
          ref={menuRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current,
              )
            }
            aria-label={`Actions for ${lesson.title}`}
            className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-40 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                <Pencil className="h-4 w-4" />
                Rename
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onMove(lesson);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                <FolderInput className="h-4 w-4" />
                Move
              </button>

              <div className="my-1 h-px bg-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(lesson);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getLessonDetail(
  lesson: MediaFile,
): string {
  if (lesson.media_type === 'audio') {
    const cueCount = parseSrt(
      lesson.srt_content ?? '',
    ).length;

    return `${cueCount} ${
      cueCount === 1 ? 'cue' : 'cues'
    }`;
  }

  if (
    lesson.media_type === 'text' &&
    lesson.content
  ) {
    const wordCount = lesson.content
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return `${wordCount} ${
      wordCount === 1 ? 'word' : 'words'
    }`;
  }

  if (
    lesson.document_filename
  ) {
    return lesson.document_filename;
  }

  if (lesson.audio_filename) {
    return lesson.audio_filename;
  }

  return 'Lesson';
}
