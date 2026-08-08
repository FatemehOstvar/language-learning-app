import { Folder, FolderOpen, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import LibraryDialog, { DeleteWarning } from '@/features/library/components/LibraryDialog';
import LibraryHeader from '@/features/library/components/LibraryHeader';
import LibrarySidebar from '@/features/library/components/LibrarySidebar';
import LibraryToolbar from '@/features/library/components/LibraryToolbar';
import LessonList from '@/features/library/components/LessonList';
import { useLibrary } from '@/features/library/hooks/useLibrary';
import { getFolderPathLabel } from '@/features/library/utils/folderNaming';
import type { LibraryFolder, MediaFile } from '@/shared/api/supabase';

interface LibraryWorkspaceProps {
  activeId: string | null;
  onSelect: (file: MediaFile) => void;
}

export default function LibraryWorkspace({
  activeId,
  onSelect,
}: LibraryWorkspaceProps) {
  const library = useLibrary();
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<LibraryFolder | null>(null);
  const [lessonToMove, setLessonToMove] = useState<MediaFile | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<MediaFile | null>(null);
  const [moveTarget, setMoveTarget] = useState('unfiled');

  useEffect(() => {
    if (lessonToMove) setMoveTarget(lessonToMove.folder_id ?? 'unfiled');
  }, [lessonToMove]);

  const hasSearchOrFilter =
    library.search.trim() !== '' || library.typeFilter !== 'all';

  const openCreateFolder = () => {
    setNewFolderName('');
    setCreateFolderOpen(true);
  };

  const sidebar = (
    <LibrarySidebar
      folders={library.folders}
      activeView={library.activeView}
      counts={library.counts}
      onSelect={(view) => {
        library.setActiveView(view);
        setMobileFoldersOpen(false);
      }}
      onCreateFolder={openCreateFolder}
      onRenameFolder={library.renameFolder}
      onDeleteFolder={setFolderToDelete}
      onMoveLesson={library.moveLesson}
    />
  );

  if (library.loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <LibraryHeader lessonCount={library.lessons.length} onCreateFolder={openCreateFolder} />

        {library.error && (
          <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span>{library.error}</span>
            <button type="button" onClick={() => library.setError(null)} aria-label="Dismiss" className="p-1 text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="hidden rounded-xl border border-slate-200 bg-white p-2.5 lg:block">
            {sidebar}
          </aside>

          <section className="min-w-0 overflow-visible rounded-xl border border-slate-200 bg-white">
            <LibraryToolbar
              activeViewName={library.activeViewName}
              visibleCount={library.visibleLessons.length}
              search={library.search}
              typeFilter={library.typeFilter}
              canReorder={library.canReorder}
              onSearchChange={library.setSearch}
              onTypeFilterChange={library.setTypeFilter}
              onOpenFolders={() => setMobileFoldersOpen(true)}
            />
            <LessonList
              lessons={library.visibleLessons}
              activeId={activeId}
              canReorder={library.canReorder}
              hasSearchOrFilter={hasSearchOrFilter}
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
          <button type="button" aria-label="Close" onClick={() => setMobileFoldersOpen(false)} className="absolute inset-0 bg-slate-950/25" />
          <aside className="absolute inset-y-0 left-0 w-[min(82vw,280px)] overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <FolderOpen className="h-4 w-4" /> Folders
              </div>
              <button type="button" onClick={() => setMobileFoldersOpen(false)} aria-label="Close" className="p-1.5 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <LibraryDialog open={createFolderOpen} title="New folder" onClose={() => setCreateFolderOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void library.createFolder(newFolderName).then((folder) => {
              if (folder) {
                setCreateFolderOpen(false);
                setNewFolderName('');
              }
            });
          }}
        >
          <input
            aria-label="Folder name"
            value={newFolderName}
            maxLength={80}
            autoFocus
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="Name"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          />
          <DialogActions
            onCancel={() => setCreateFolderOpen(false)}
            action="Create"
            disabled={!newFolderName.trim()}
          />
        </form>
      </LibraryDialog>

      <LibraryDialog
        open={Boolean(folderToDelete)}
        title="Delete folder?"
        description={folderToDelete ? getFolderPathLabel(folderToDelete.name) : undefined}
        onClose={() => setFolderToDelete(null)}
      >
        <DeleteWarning />
        <DialogActions
          onCancel={() => setFolderToDelete(null)}
          action="Delete"
          danger
          onAction={() => {
            if (!folderToDelete) return;
            void library.removeFolder(folderToDelete.id).then((deleted) => {
              if (deleted) setFolderToDelete(null);
            });
          }}
        />
      </LibraryDialog>

      <LibraryDialog
        open={Boolean(lessonToMove)}
        title="Move"
        description={lessonToMove?.title}
        onClose={() => setLessonToMove(null)}
      >
        <select
          aria-label="Destination"
          value={moveTarget}
          onChange={(event) => setMoveTarget(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="unfiled">Unfiled</option>
          {library.folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {getFolderPathLabel(folder.name)}
            </option>
          ))}
        </select>
        <DialogActions
          onCancel={() => setLessonToMove(null)}
          action="Move"
          icon={Folder}
          onAction={() => {
            if (!lessonToMove) return;
            const folderId = moveTarget === 'unfiled' ? null : moveTarget;
            void library.moveLesson(lessonToMove.id, folderId).then((moved) => {
              if (moved) setLessonToMove(null);
            });
          }}
        />
      </LibraryDialog>

      <LibraryDialog
        open={Boolean(lessonToDelete)}
        title="Delete lesson?"
        description={lessonToDelete?.title}
        onClose={() => setLessonToDelete(null)}
      >
        <DialogActions
          onCancel={() => setLessonToDelete(null)}
          action="Delete"
          danger
          onAction={() => {
            if (!lessonToDelete) return;
            void library.deleteLesson(lessonToDelete).then((deleted) => {
              if (deleted) setLessonToDelete(null);
            });
          }}
        />
      </LibraryDialog>
    </div>
  );
}

function DialogActions({
  onCancel,
  action,
  onAction,
  disabled = false,
  danger = false,
  icon: Icon,
}: {
  onCancel: () => void;
  action: string;
  onAction?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: typeof Folder;
}) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="h-9 rounded-lg px-3 text-sm text-slate-500 hover:bg-slate-100">
        Cancel
      </button>
      <button
        type={onAction ? 'button' : 'submit'}
        disabled={disabled}
        onClick={onAction}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium text-white disabled:bg-slate-200 ${
          danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {action}
      </button>
    </div>
  );
}
