import {
  Check,
  Folder,
  FolderOpen,
  Layers3,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import type {
  LibraryCounts,
  LibraryView,
} from '@/features/library/model/types';
import {
  makeSeriesFolderName,
  parseFolderName,
} from '@/features/library/utils/folderNaming';
import type { LibraryFolder } from '@/shared/api/supabase';

interface LibrarySidebarProps {
  folders: LibraryFolder[];
  activeView: LibraryView;
  counts: LibraryCounts;
  onSelect: (view: LibraryView) => void;
  onCreateFolder: () => void;
  onRenameFolder: (id: string, name: string) => Promise<boolean>;
  onDeleteFolder: (folder: LibraryFolder) => void;
  onMoveLesson: (lessonId: string, folderId: string | null) => Promise<boolean>;
}

const LESSON_DRAG_TYPE = 'application/x-lingualab-lesson';

function getDraggedLessonId(event: DragEvent): string {
  return (
    event.dataTransfer.getData(LESSON_DRAG_TYPE) ||
    event.dataTransfer.getData('text/plain')
  );
}

export default function LibrarySidebar({
  folders,
  activeView,
  counts,
  onSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveLesson,
}: LibrarySidebarProps) {
  const grouped = useMemo(() => {
    const series = new Map<string, LibraryFolder[]>();
    const plain: LibraryFolder[] = [];

    for (const folder of folders) {
      const parsed = parseFolderName(folder.name);
      if (!parsed.seriesName) {
        plain.push(folder);
        continue;
      }

      const items = series.get(parsed.seriesName) ?? [];
      items.push(folder);
      series.set(parsed.seriesName, items);
    }

    return {
      plain,
      series: Array.from(series.entries()),
    };
  }, [folders]);

  const renderFolder = (folder: LibraryFolder) => (
    <FolderItem
      key={folder.id}
      folder={folder}
      count={counts.byFolder.get(folder.id) ?? 0}
      active={
        activeView.kind === 'folder' && activeView.folderId === folder.id
      }
      onSelect={() => onSelect({ kind: 'folder', folderId: folder.id })}
      onRename={onRenameFolder}
      onDelete={() => onDeleteFolder(folder)}
      onDropLesson={(lessonId) => onMoveLesson(lessonId, folder.id)}
    />
  );

  return (
    <nav aria-label="Library" className="space-y-4">
      <div className="space-y-1">
        <CollectionButton
          label="All"
          count={counts.all}
          active={activeView.kind === 'all'}
          icon={FolderOpen}
          onClick={() => onSelect({ kind: 'all' })}
        />
        <DropCollectionButton
          label="Unfiled"
          count={counts.unfiled}
          active={activeView.kind === 'unfiled'}
          onClick={() => onSelect({ kind: 'unfiled' })}
          onDropLesson={(lessonId) => onMoveLesson(lessonId, null)}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Folders
          </span>
          <button
            type="button"
            onClick={onCreateFolder}
            aria-label="New folder"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {grouped.series.map(([seriesName, books]) => (
            <div key={seriesName}>
              <div className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-medium text-slate-400">
                <Layers3 className="h-3 w-3" />
                <span className="truncate">{seriesName}</span>
              </div>
              <div className="space-y-1 pl-2">{books.map(renderFolder)}</div>
            </div>
          ))}

          <div className="space-y-1">{grouped.plain.map(renderFolder)}</div>

          {folders.length === 0 && (
            <p className="px-2 py-2 text-xs text-slate-400">Empty</p>
          )}
        </div>
      </div>
    </nav>
  );
}

interface CollectionButtonProps {
  label: string;
  count: number;
  active: boolean;
  icon: typeof Folder;
  onClick: () => void;
}

function CollectionButton({
  label,
  count,
  active,
  icon: Icon,
  onClick,
}: CollectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums opacity-60">{count}</span>
    </button>
  );
}

function DropCollectionButton({
  label,
  count,
  active,
  onClick,
  onDropLesson,
}: Omit<CollectionButtonProps, 'icon'> & {
  onDropLesson: (lessonId: string) => Promise<boolean>;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const id = getDraggedLessonId(event);
        if (id) void onDropLesson(id);
      }}
      className={dragOver ? 'rounded-lg ring-2 ring-emerald-200' : ''}
    >
      <CollectionButton
        label={label}
        count={count}
        active={active}
        icon={Folder}
        onClick={onClick}
      />
    </div>
  );
}

function FolderItem({
  folder,
  count,
  active,
  onSelect,
  onRename,
  onDelete,
  onDropLesson,
}: {
  folder: LibraryFolder;
  count: number;
  active: boolean;
  onSelect: () => void;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: () => void;
  onDropLesson: (lessonId: string) => Promise<boolean>;
}) {
  const parsed = parseFolderName(folder.name);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(parsed.displayName);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(parsed.displayName);
  }, [parsed.displayName]);

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

  const save = async () => {
    const nextName = parsed.seriesName
      ? makeSeriesFolderName(parsed.seriesName, name)
      : name;
    if (await onRename(folder.id, nextName)) setEditing(false);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const id = getDraggedLessonId(event);
        if (id) void onDropLesson(id);
      }}
      className={`group relative flex min-h-9 items-center gap-1 rounded-lg ${
        dragOver ? 'ring-2 ring-emerald-200' : ''
      } ${active ? 'bg-emerald-50' : 'hover:bg-slate-100'}`}
    >
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 px-1.5 py-1">
          <input
            ref={inputRef}
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void save();
              if (event.key === 'Escape') {
                setName(parsed.displayName);
                setEditing(false);
              }
            }}
            className="h-7 min-w-0 flex-1 rounded-md border border-slate-300 px-2 text-xs outline-none"
          />
          <button type="button" onClick={() => void save()} className="p-1 text-emerald-600">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setName(parsed.displayName);
              setEditing(false);
            }}
            className="p-1 text-slate-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className={`flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm ${
              active ? 'font-medium text-emerald-800' : 'text-slate-600'
            }`}
          >
            <Folder className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="min-w-0 flex-1 truncate">{parsed.displayName}</span>
            <span className="text-xs tabular-nums opacity-50">{count}</span>
          </button>

          <div ref={menuRef} className="relative pr-1">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={`Actions for ${parsed.displayName}`}
              className="rounded-md p-1 text-slate-400 opacity-0 hover:bg-white group-hover:opacity-100 focus:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 z-40 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditing(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
