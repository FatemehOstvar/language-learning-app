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
import type { MediaFile } from '@/shared/api/supabase';

interface LessonRowProps {
  lesson: MediaFile;
  active: boolean;
  canReorder: boolean;
  onOpen: (lesson: MediaFile) => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onMove: (lesson: MediaFile) => void;
  onDelete: (lesson: MediaFile) => void;
  onReorder: (draggedId: string, targetId: string) => Promise<void>;
}

const LESSON_DRAG_TYPE = 'application/x-lingualab-lesson';

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
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setTitle(lesson.title), [lesson.title]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const saveTitle = async () => {
    if (await onRename(lesson.id, title)) setEditing(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (!canReorder) return;
    const draggedId =
      event.dataTransfer.getData(LESSON_DRAG_TYPE) ||
      event.dataTransfer.getData('text/plain');
    if (draggedId) void onReorder(draggedId, lesson.id);
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(LESSON_DRAG_TYPE, lesson.id);
        event.dataTransfer.setData('text/plain', lesson.id);
      }}
      onDragOver={(event) => {
        if (!canReorder) return;
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`group grid min-h-14 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 sm:px-4 ${
        dragOver ? 'bg-emerald-50' : active ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
      }`}
    >
      <GripVertical
        className={`h-3.5 w-3.5 text-slate-300 ${
          canReorder ? 'cursor-grab opacity-0 group-hover:opacity-100' : 'opacity-0'
        }`}
      />
      <Icon className="h-4 w-4 text-slate-400" />

      <div className="min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={title}
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void saveTitle();
                if (event.key === 'Escape') {
                  setTitle(lesson.title);
                  setEditing(false);
                }
              }}
              className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-2 text-sm outline-none"
            />
            <button type="button" onClick={() => void saveTitle()} className="p-1.5 text-emerald-600">
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(lesson.title);
                setEditing(false);
              }}
              className="p-1.5 text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => onOpen(lesson)} className="block max-w-full text-left">
            <p className="truncate text-sm font-medium text-slate-900">{lesson.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {LESSON_TYPE_LABELS[lesson.media_type]}
            </p>
          </button>
        )}
      </div>

      {!editing && (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={`Actions for ${lesson.title}`}
            className="rounded-md p-1.5 text-slate-400 opacity-0 hover:bg-white hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-40 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <MenuButton icon={Pencil} label="Rename" onClick={() => {
                setMenuOpen(false);
                setEditing(true);
              }} />
              <MenuButton icon={FolderInput} label="Move" onClick={() => {
                setMenuOpen(false);
                onMove(lesson);
              }} />
              <MenuButton icon={Trash2} label="Delete" danger onClick={() => {
                setMenuOpen(false);
                onDelete(lesson);
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  danger = false,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
