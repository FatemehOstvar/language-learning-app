import {
  Check,
  Folder,
  FolderOpen,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import type {
  LibraryCounts,
  LibraryView,
} from '@/features/library/model/types';
import type {
  LibraryFolder,
} from '@/shared/api/supabase';

interface LibrarySidebarProps {
  folders: LibraryFolder[];
  activeView: LibraryView;
  counts: LibraryCounts;
  onSelect: (view: LibraryView) => void;
  onCreateFolder: () => void;
  onRenameFolder: (
    id: string,
    name: string,
  ) => Promise<boolean>;
  onDeleteFolder: (
    folder: LibraryFolder,
  ) => void;
  onMoveLesson: (
    lessonId: string,
    folderId: string | null,
  ) => Promise<boolean>;
}

const LESSON_DRAG_TYPE =
  'application/x-lingualab-lesson';

function getDraggedLessonId(
  event: DragEvent,
): string {
  return (
    event.dataTransfer.getData(
      LESSON_DRAG_TYPE,
    ) ||
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
  return (
    <nav
      aria-label="Library folders"
      className="space-y-5"
    >
      <div className="space-y-1">
        <CollectionButton
          label="All lessons"
          count={counts.all}
          active={activeView.kind === 'all'}
          icon={FolderOpen}
          onClick={() =>
            onSelect({ kind: 'all' })
          }
        />

        <DropCollectionButton
          label="Unfiled"
          count={counts.unfiled}
          active={activeView.kind === 'unfiled'}
          onClick={() =>
            onSelect({ kind: 'unfiled' })
          }
          onDropLesson={(lessonId) =>
            onMoveLesson(lessonId, null)
          }
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Folders
          </p>

          <button
            type="button"
            onClick={onCreateFolder}
            aria-label="Create folder"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {folders.length === 0 ? (
          <p className="px-2 py-2 text-xs leading-5 text-slate-400">
            Create a folder, then drag lessons into it.
          </p>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                count={
                  counts.byFolder.get(folder.id) ?? 0
                }
                active={
                  activeView.kind === 'folder' &&
                  activeView.folderId === folder.id
                }
                onSelect={() =>
                  onSelect({
                    kind: 'folder',
                    folderId: folder.id,
                  })
                }
                onRename={onRenameFolder}
                onDelete={() =>
                  onDeleteFolder(folder)
                }
                onDropLesson={(lessonId) =>
                  onMoveLesson(
                    lessonId,
                    folder.id,
                  )
                }
              />
            ))}
          </div>
        )}
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
      <Icon
        className={`h-4 w-4 shrink-0 ${
          active
            ? 'text-white'
            : 'text-slate-400'
        }`}
      />

      <span className="min-w-0 flex-1 truncate">
        {label}
      </span>

      <span
        className={`text-xs tabular-nums ${
          active
            ? 'text-slate-300'
            : 'text-slate-400'
        }`}
      >
        {count}
      </span>
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
  onDropLesson: (
    lessonId: string,
  ) => Promise<boolean>;
}) {
  const [dragOver, setDragOver] =
    useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() =>
        setDragOver(false)
      }
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);

        const lessonId =
          getDraggedLessonId(event);

        if (lessonId) {
          void onDropLesson(lessonId);
        }
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
          dragOver
            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
            : active
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Folder
          className={`h-4 w-4 shrink-0 ${
            dragOver
              ? 'text-emerald-600'
              : active
                ? 'text-white'
                : 'text-slate-400'
          }`}
        />

        <span className="min-w-0 flex-1 truncate">
          {label}
        </span>

        <span
          className={`text-xs tabular-nums ${
            active && !dragOver
              ? 'text-slate-300'
              : 'text-slate-400'
          }`}
        >
          {count}
        </span>
      </button>
    </div>
  );
}

interface FolderItemProps {
  folder: LibraryFolder;
  count: number;
  active: boolean;
  onSelect: () => void;
  onRename: (
    id: string,
    name: string,
  ) => Promise<boolean>;
  onDelete: () => void;
  onDropLesson: (
    lessonId: string,
  ) => Promise<boolean>;
}

function FolderItem({
  folder,
  count,
  active,
  onSelect,
  onRename,
  onDelete,
  onDropLesson,
}: FolderItemProps) {
  const [editing, setEditing] =
    useState(false);
  const [draft, setDraft] =
    useState(folder.name);
  const [menuOpen, setMenuOpen] =
    useState(false);
  const [dragOver, setDragOver] =
    useState(false);

  const inputRef =
    useRef<HTMLInputElement>(null);
  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(folder.name);
  }, [folder.name]);

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

  const saveRename = async () => {
    const saved = await onRename(
      folder.id,
      draft,
    );

    if (saved) {
      setEditing(false);
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() =>
        setDragOver(false)
      }
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);

        const lessonId =
          getDraggedLessonId(event);

        if (lessonId) {
          void onDropLesson(lessonId);
        }
      }}
      className="group relative"
    >
      <div
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 transition ${
          dragOver
            ? 'bg-emerald-50 ring-1 ring-emerald-300'
            : active
              ? 'bg-slate-100'
              : 'hover:bg-slate-100'
        }`}
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100" />

        <Folder
          className={`h-4 w-4 shrink-0 ${
            dragOver
              ? 'text-emerald-600'
              : active
                ? 'text-slate-700'
                : 'text-slate-400'
          }`}
        />

        {editing ? (
          <>
            <input
              ref={inputRef}
              value={draft}
              maxLength={80}
              onChange={(event) =>
                setDraft(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void saveRename();
                }

                if (event.key === 'Escape') {
                  setDraft(folder.name);
                  setEditing(false);
                }
              }}
              className="h-7 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-400"
            />

            <button
              type="button"
              onClick={() =>
                void saveRename()
              }
              aria-label="Save folder name"
              className="rounded-md p-1 text-emerald-600 hover:bg-white"
            >
              <Check className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setDraft(folder.name);
                setEditing(false);
              }}
              aria-label="Cancel folder rename"
              className="rounded-md p-1 text-slate-400 hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSelect}
              className={`min-w-0 flex-1 truncate py-0.5 text-left text-sm ${
                active
                  ? 'font-medium text-slate-900'
                  : 'text-slate-600'
              }`}
            >
              {folder.name}
            </button>

            <span className="text-xs tabular-nums text-slate-400">
              {count}
            </span>

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
                aria-label={`Folder actions for ${folder.name}`}
                className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-7 z-30 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
