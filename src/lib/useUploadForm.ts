import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MediaFile } from '@/lib/supabase';
import {
  clearFileInput,
  getFileTitle,
  isAudioFile,
  isDocumentFile,
} from '@/lib/uploadFileUtils';
import {
  createAudioDocumentLesson,
  createDocumentLesson,
  createTextLesson,
} from '@/lib/uploadLessonService';
import type {
  DragTarget,
  UploadTab,
} from '@/lib/uploadTypes';

interface UseUploadFormOptions {
  onUploaded: (file: MediaFile) => void;
}

export function useUploadForm({ onUploaded }: UseUploadFormOptions) {
  const [tab, setTab] = useState<UploadTab>('audio-document');
  const [lessonTitle, setLessonTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [companionFile, setCompanionFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [textBoxContent, setTextBoxContent] = useState('');
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const companionInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(
    () => textBoxContent.trim().split(/\s+/).filter(Boolean).length,
    [textBoxContent],
  );

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const handleTabChange = useCallback(
    (nextTab: UploadTab) => {
      setTab(nextTab);
      resetMessages();
      setProgress(0);
      setProgressMessage('');
    },
    [resetMessages],
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setLessonTitle(value);
      resetMessages();
    },
    [resetMessages],
  );

  const handleTextChange = useCallback(
    (value: string) => {
      setTextBoxContent(value);
      resetMessages();
    },
    [resetMessages],
  );

  const handleAudioFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isAudioFile(file)) {
        setError(
          'Please select a supported audio file such as MP3, M4A, WAV, OGG, AAC, FLAC, or WebM.',
        );
        return;
      }

      setAudioFile(file);
      setLessonTitle((title) => title.trim() || getFileTitle(file.name));
    },
    [resetMessages],
  );

  const handleCompanionFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isDocumentFile(file)) {
        setError('The companion document must be a PDF or EPUB file.');
        return;
      }
      setCompanionFile(file);
    },
    [resetMessages],
  );

  const handleDocumentFile = useCallback(
    (file: File) => {
      resetMessages();
      if (!isDocumentFile(file)) {
        setError('Please select a PDF or EPUB file.');
        return;
      }

      setDocumentFile(file);
      setLessonTitle((title) => title.trim() || getFileTitle(file.name));
    },
    [resetMessages],
  );

  const removeAudioFile = useCallback(() => {
    setAudioFile(null);
    clearFileInput(audioInputRef);
    resetMessages();
  }, [resetMessages]);

  const removeCompanionFile = useCallback(() => {
    setCompanionFile(null);
    clearFileInput(companionInputRef);
    resetMessages();
  }, [resetMessages]);

  const removeDocumentFile = useCallback(() => {
    setDocumentFile(null);
    clearFileInput(documentInputRef);
    resetMessages();
  }, [resetMessages]);

  const resetForm = useCallback(() => {
    setLessonTitle('');
    setAudioFile(null);
    setCompanionFile(null);
    setDocumentFile(null);
    setTextBoxContent('');
    setProgress(0);
    setProgressMessage('');
    clearFileInput(audioInputRef);
    clearFileInput(companionInputRef);
    clearFileInput(documentInputRef);
  }, []);

  const canSubmit = useMemo(() => {
    if (uploading || !lessonTitle.trim()) return false;
    if (tab === 'audio-document') return Boolean(audioFile && companionFile);
    if (tab === 'document') return Boolean(documentFile);
    return Boolean(textBoxContent.trim());
  }, [
    uploading,
    lessonTitle,
    tab,
    audioFile,
    companionFile,
    documentFile,
    textBoxContent,
  ]);

  const handleSubmit = useCallback(async () => {
    const title = lessonTitle.trim();

    if (!title) {
      setError('Please enter a lesson title.');
      return;
    }

    setUploading(true);
    setSuccess(false);
    setError(null);
    setProgress(0);

    try {
      let lesson: MediaFile;

      if (tab === 'audio-document') {
        if (!audioFile || !companionFile) {
          throw new Error(
            'Please select both an audio file and a PDF or EPUB document.',
          );
        }

        lesson = await createAudioDocumentLesson({
          title,
          audioFile,
          companionFile,
          onProgress: setProgress,
          onMessage: setProgressMessage,
        });
      } else if (tab === 'document') {
        if (!documentFile) {
          throw new Error('Please select a PDF or EPUB file.');
        }

        lesson = await createDocumentLesson({
          title,
          documentFile,
          onProgress: setProgress,
          onMessage: setProgressMessage,
        });
      } else {
        if (!textBoxContent.trim()) {
          throw new Error('Please enter some lesson text.');
        }

        lesson = await createTextLesson({
          title,
          text: textBoxContent,
          onMessage: setProgressMessage,
        });
      }

      onUploaded(lesson);
      resetForm();
      setSuccess(true);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'The lesson could not be created.',
      );
    } finally {
      setUploading(false);
      setProgressMessage('');
    }
  }, [
    lessonTitle,
    tab,
    audioFile,
    companionFile,
    documentFile,
    textBoxContent,
    onUploaded,
    resetForm,
  ]);

  return {
    tab,
    lessonTitle,
    audioFile,
    companionFile,
    documentFile,
    textBoxContent,
    dragging,
    uploading,
    progress,
    progressMessage,
    error,
    success,
    wordCount,
    canSubmit,
    audioInputRef,
    companionInputRef,
    documentInputRef,
    setDragging,
    handleTabChange,
    handleTitleChange,
    handleTextChange,
    handleAudioFile,
    handleCompanionFile,
    handleDocumentFile,
    removeAudioFile,
    removeCompanionFile,
    removeDocumentFile,
    handleSubmit,
  };
}
