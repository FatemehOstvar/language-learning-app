import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createLibraryFolder,
  deleteLesson as deleteLessonRecord,
  deleteLibraryFolder,
  fetchLibraryFolders,
  fetchLibraryLessons,
  moveLesson as moveLessonRecord,
  renameLesson as renameLessonRecord,
  renameLibraryFolder,
  saveLessonOrder,
} from '@/features/library/api/library';
import { getFolderDisplayName } from '@/features/library/utils/folderNaming';
import type {
  LessonTypeFilter,
  LibraryCounts,
  LibraryView,
} from '@/features/library/model/types';
import type {
  LibraryFolder,
  MediaFile,
} from '@/shared/api/supabase';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function lessonMatchesView(lesson: MediaFile, view: LibraryView): boolean {
  if (view.kind === 'all') return true;
  if (view.kind === 'unfiled') return lesson.folder_id === null;
  return lesson.folder_id === view.folderId;
}

function sortLessons(lessons: MediaFile[], view: LibraryView): MediaFile[] {
  return [...lessons].sort((a, b) => {
    if (view.kind === 'all') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function useLibrary() {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [lessons, setLessons] = useState<MediaFile[]>([]);
  const [activeView, setActiveView] = useState<LibraryView>({ kind: 'all' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<LessonTypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextFolders, nextLessons] = await Promise.all([
        fetchLibraryFolders(),
        fetchLibraryLessons(),
      ]);

      setFolders(nextFolders);
      setLessons(nextLessons);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Could not load library.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo<LibraryCounts>(() => {
    const byFolder = new Map<string, number>();
    let unfiled = 0;

    for (const lesson of lessons) {
      if (!lesson.folder_id) {
        unfiled += 1;
        continue;
      }

      byFolder.set(
        lesson.folder_id,
        (byFolder.get(lesson.folder_id) ?? 0) + 1,
      );
    }

    return { all: lessons.length, unfiled, byFolder };
  }, [lessons]);

  const visibleLessons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortLessons(
      lessons.filter((lesson) => {
        if (!lessonMatchesView(lesson, activeView)) return false;
        if (typeFilter !== 'all' && lesson.media_type !== typeFilter) return false;
        return !query || lesson.title.toLowerCase().includes(query);
      }),
      activeView,
    );
  }, [activeView, lessons, search, typeFilter]);

  const activeViewName = useMemo(() => {
    if (activeView.kind === 'all') return 'All';
    if (activeView.kind === 'unfiled') return 'Unfiled';

    const folder = folders.find((item) => item.id === activeView.folderId);
    return folder ? getFolderDisplayName(folder.name) : 'Folder';
  }, [activeView, folders]);

  const canReorder =
    activeView.kind !== 'all' && search.trim() === '' && typeFilter === 'all';

  const nextSortOrder = useCallback(
    (folderId: string | null) => {
      const folderLessons = lessons.filter(
        (lesson) => lesson.folder_id === folderId,
      );

      return Math.max(-1, ...folderLessons.map((lesson) => lesson.sort_order)) + 1;
    },
    [lessons],
  );

  const createFolder = useCallback(
    async (name: string) => {
      const cleanName = name.trim();
      if (!cleanName) return null;

      setError(null);
      try {
        const folder = await createLibraryFolder(cleanName, folders.length);
        setFolders((current) => [...current, folder]);
        setActiveView({ kind: 'folder', folderId: folder.id });
        return folder;
      } catch (createError) {
        setError(getErrorMessage(createError, 'Could not create folder.'));
        return null;
      }
    },
    [folders.length],
  );

  const renameFolder = useCallback(async (id: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return false;

    setError(null);
    try {
      const updated = await renameLibraryFolder(id, cleanName);
      setFolders((current) =>
        current.map((folder) => (folder.id === id ? updated : folder)),
      );
      return true;
    } catch (renameError) {
      setError(getErrorMessage(renameError, 'Could not rename folder.'));
      return false;
    }
  }, []);

  const removeFolder = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteLibraryFolder(id);
      setFolders((current) => current.filter((folder) => folder.id !== id));
      setLessons((current) =>
        current.map((lesson) =>
          lesson.folder_id === id ? { ...lesson, folder_id: null } : lesson,
        ),
      );
      setActiveView((current) =>
        current.kind === 'folder' && current.folderId === id
          ? { kind: 'unfiled' }
          : current,
      );
      return true;
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Could not delete folder.'));
      return false;
    }
  }, []);

  const renameLesson = useCallback(async (id: string, title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return false;

    setError(null);
    try {
      const updated = await renameLessonRecord(id, cleanTitle);
      setLessons((current) =>
        current.map((lesson) => (lesson.id === id ? updated : lesson)),
      );
      return true;
    } catch (renameError) {
      setError(getErrorMessage(renameError, 'Could not rename lesson.'));
      return false;
    }
  }, []);

  const moveLesson = useCallback(
    async (lessonId: string, folderId: string | null) => {
      const currentLesson = lessons.find((lesson) => lesson.id === lessonId);
      if (!currentLesson || currentLesson.folder_id === folderId) return true;

      setError(null);
      try {
        const updated = await moveLessonRecord(
          lessonId,
          folderId,
          nextSortOrder(folderId),
        );
        setLessons((current) =>
          current.map((lesson) => (lesson.id === lessonId ? updated : lesson)),
        );
        return true;
      } catch (moveError) {
        setError(getErrorMessage(moveError, 'Could not move lesson.'));
        return false;
      }
    },
    [lessons, nextSortOrder],
  );

  const reorderLesson = useCallback(
    async (draggedId: string, targetId: string) => {
      if (!canReorder || draggedId === targetId) return;

      const collection = sortLessons(
        lessons.filter((lesson) => lessonMatchesView(lesson, activeView)),
        activeView,
      );
      const sourceIndex = collection.findIndex((lesson) => lesson.id === draggedId);
      const targetIndex = collection.findIndex((lesson) => lesson.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      const reordered = [...collection];
      const [dragged] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, dragged);

      const updates = reordered.map((lesson, index) => ({
        id: lesson.id,
        sort_order: index,
      }));

      setLessons((current) =>
        current.map((lesson) => {
          const update = updates.find((item) => item.id === lesson.id);
          return update ? { ...lesson, sort_order: update.sort_order } : lesson;
        }),
      );

      try {
        await saveLessonOrder(updates);
      } catch (orderError) {
        setError(getErrorMessage(orderError, 'Could not save order.'));
        void load();
      }
    },
    [activeView, canReorder, lessons, load],
  );

  const deleteLesson = useCallback(async (lesson: MediaFile) => {
    setError(null);
    try {
      await deleteLessonRecord(lesson);
      setLessons((current) => current.filter((item) => item.id !== lesson.id));
      return true;
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Could not delete lesson.'));
      return false;
    }
  }, []);

  return {
    folders,
    lessons,
    visibleLessons,
    activeView,
    activeViewName,
    search,
    typeFilter,
    loading,
    error,
    counts,
    canReorder,
    setActiveView,
    setSearch,
    setTypeFilter,
    setError,
    load,
    createFolder,
    renameFolder,
    removeFolder,
    renameLesson,
    moveLesson,
    reorderLesson,
    deleteLesson,
  };
}
