import {
  Folder,
  FolderOpen,
  Loader2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import LibraryDialog, {
  DeleteWarning,
} from '@/features/library/components/LibraryDialog';
import LibraryHeader from '@/features/library/components/LibraryHeader';
import LibrarySidebar from '@/features/library/components/LibrarySidebar';
import LibraryToolbar from '@/features/library/components/LibraryToolbar';
import LessonList from '@/features/library/components/LessonList';
import { useLibrary } from '@/features/library/hooks/useLibrary';
import type {
  LibraryFolder,
  MediaFile,
} from '@/shared/api/supabase';

interface LibraryWorkspaceProps {
  activeId: string | null;
  onSelect: (file: MediaFile) => void;
}

export default function LibraryWorkspace({
  activeId,
  onSelect,
}: LibraryWorkspaceProps) {
  const library = useLibrary();

  const [mobileFoldersOpen, setMobileFoldersOpen] =
    useState(false);

  const [createFolderOpen, setCreateFolderOpen] =
    useState(false);

  const [newFolderName, setNewFolderName] =
    useState('');

  const [folderToDelete, setFolderToDelete] =
    useState<LibraryFolder | null>(null);

  const [lessonToMove, setLessonToMove] =
    useState<MediaFile | null>(null);

  const [lessonToDelete, setLessonToDelete] =
    useState<MediaFile | null>(null);

  const [moveTarget, setMoveTarget] =
    useState<string>('unfiled');

  useEffect(() => {
    if (!lessonToMove) {
      return;
    }

    setMoveTarget(
      lessonToMove.folder_id ?? 'unfiled',
    );
  }, [lessonToMove]);

  const hasSearchOrFilter =
    library.search.trim() !== '' ||
    library.typeFilter !== 'all';

  const sidebar = (
    <LibrarySidebar
      folders={library.folders}
      activeView={library.activeView}
      counts={library.counts}
      onSelect={(view) => {
        library.setActiveView(view);
        setMobileFoldersOpen(false);
      }}
      onCreateFolder={() => {
        setNewFolderName('');
        setCreateFolderOpen(true);
      }}
      onRenameFolder={library.renameFolder}
      onDeleteFolder={setFolderToDelete}
      onMoveLesson={library.moveLesson}
    />
  );

  if (library.loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        <LibraryHeader
          lessonCount={library.lessons.length}
          onCreateFolder={() => {
            setNewFolderName('');
            setCreateFolderOpen(true);
          }}
        />

        {library.error && (
          <div
            role="alert"
            className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{library.error}</span>

            <button
              type="button"
              onClick={() =>
                library.setError(null)
              }
              aria-label="Dismiss error"
              className="rounded p-0.5 text-red-400 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 lg:block">
            {sidebar}
          </aside>

         <section className="min-w-0 overflow-visible rounded-2xl border border-slate-200 bg-white">
            <LibraryToolbar
              activeViewName={library.activeViewName}
              visibleCount={
                library.visibleLessons.length
              }
              search={library.search}
              typeFilter={library.typeFilter}
              canReorder={library.canReorder}
              onSearchChange={library.setSearch}
              onTypeFilterChange={
                library.setTypeFilter
              }
              onOpenFolders={() =>
                setMobileFoldersOpen(true)
              }
            />

            <LessonList
              lessons={library.visibleLessons}
              activeId={activeId}
              canReorder={library.canReorder}
              hasSearchOrFilter={
                hasSearchOrFilter
              }
              onOpen={onSelect}
              onRename={library.renameLesson}
              onMove={setLessonToMove}
              onDelete={setLessonToDelete}
              onReorder={library.reorderLesson}
            />
          </section>
        </div>
      </div>

      {mobileFoldersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close folder drawer"
            onClick={() =>
              setMobileFoldersOpen(false)
            }
            className="absolute inset-0 bg-slate-950/30"
          />

          <aside className="absolute inset-y-0 left-0 w-[min(82vw,300px)] overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">
                  Folders
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFoldersOpen(false)
                }
                aria-label="Close folders"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sidebar}
          </aside>
        </div>
      )}

      <LibraryDialog
        open={createFolderOpen}
        title="New folder"
        description="Create one level of folders to organize your lessons."
        onClose={() =>
          setCreateFolderOpen(false)
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();

            void library
              .createFolder(newFolderName)
              .then((folder) => {
                if (folder) {
                  setCreateFolderOpen(false);
                  setNewFolderName('');
                }
              });
          }}
        >
          <label
            htmlFor="new-folder-name"
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Folder name
          </label>

          <input
            id="new-folder-name"
            value={newFolderName}
            maxLength={80}
            autoFocus
            onChange={(event) =>
              setNewFolderName(
                event.target.value,
              )
            }
            placeholder="Podcasts"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setCreateFolderOpen(false)
              }
              className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="h-9 rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200"
            >
              Create folder
            </button>
          </div>
        </form>
      </LibraryDialog>

      <LibraryDialog
        open={Boolean(folderToDelete)}
        title="Delete folder?"
        description={
          folderToDelete
            ? `Delete “${folderToDelete.name}”?`
            : undefined
        }
        onClose={() =>
          setFolderToDelete(null)
        }
      >
        <DeleteWarning />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setFolderToDelete(null)
            }
            className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (!folderToDelete) {
                return;
              }

              void library
                .removeFolder(
                  folderToDelete.id,
                )
                .then((deleted) => {
                  if (deleted) {
                    setFolderToDelete(null);
                  }
                });
            }}
            className="h-9 rounded-lg bg-red-600 px-3.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete folder
          </button>
        </div>
      </LibraryDialog>

      <LibraryDialog
        open={Boolean(lessonToMove)}
        title="Move lesson"
        description={lessonToMove?.title}
        onClose={() =>
          setLessonToMove(null)
        }
      >
        <label
          htmlFor="move-folder"
          className="mb-1.5 block text-sm font-medium text-slate-800"
        >
          Destination
        </label>

        <select
          id="move-folder"
          value={moveTarget}
          onChange={(event) =>
            setMoveTarget(event.target.value)
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="unfiled">
            Unfiled
          </option>

          {library.folders.map((folder) => (
            <option
              key={folder.id}
              value={folder.id}
            >
              {folder.name}
            </option>
          ))}
        </select>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setLessonToMove(null)
            }
            className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (!lessonToMove) {
                return;
              }

              const folderId =
                moveTarget === 'unfiled'
                  ? null
                  : moveTarget;

              void library
                .moveLesson(
                  lessonToMove.id,
                  folderId,
                )
                .then((moved) => {
                  if (moved) {
                    setLessonToMove(null);
                  }
                });
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Folder className="h-4 w-4" />
            Move
          </button>
        </div>
      </LibraryDialog>

      <LibraryDialog
        open={Boolean(lessonToDelete)}
        title="Delete lesson?"
        description={lessonToDelete?.title}
        onClose={() =>
          setLessonToDelete(null)
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          The lesson will be removed from the
          library. Its uploaded audio or document
          will also be removed when the stored URL
          can be resolved.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setLessonToDelete(null)
            }
            className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (!lessonToDelete) {
                return;
              }

              void library
                .deleteLesson(lessonToDelete)
                .then((deleted) => {
                  if (deleted) {
                    setLessonToDelete(null);
                  }
                });
            }}
            className="h-9 rounded-lg bg-red-600 px-3.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete lesson
          </button>
        </div>
      </LibraryDialog>
    </div>
  );
}
